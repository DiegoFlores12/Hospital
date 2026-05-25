import { Api } from '../core/api.js';
import { View } from '../ui/view.js';

const appointmentDraft = {};

function setLoading(element, text = 'Cargando...') {
  if (element) element.innerHTML = View.empty(text);
}

function seleccionarOpcion(elemento) {
  const hermanos = elemento.parentElement.querySelectorAll('.card-opcion, .hora-slot');
  hermanos.forEach(hermano => hermano.classList.remove('seleccionado'));
  elemento.classList.add('seleccionado');
}

export function seleccionarEspecialidad(elemento) {
  seleccionarOpcion(elemento);
  appointmentDraft.especialidad = elemento.dataset.especialidad || elemento.querySelector('h4')?.innerText || '';
  appointmentDraft.doctorId = null;
  appointmentDraft.hora = null;

  const doctores = document.getElementById('doctores-disponibles');
  if (doctores) doctores.innerHTML = View.empty(`Presiona Siguiente para ver doctores de ${appointmentDraft.especialidad}.`);

  const horas = document.getElementById('horas-disponibles');
  if (horas) horas.innerHTML = View.empty('Selecciona doctor y fecha para cargar horarios.');
}

export function seleccionarDoctor(elemento) {
  seleccionarOpcion(elemento);
  appointmentDraft.doctorId = elemento.dataset.doctorId;
  appointmentDraft.hora = null;

  const horas = document.getElementById('horas-disponibles');
  if (horas) horas.innerHTML = View.empty('Selecciona fecha para cargar horarios.');
  cargarHorasDisponibles();
}

export function seleccionarHora(elemento) {
  seleccionarOpcion(elemento);
  appointmentDraft.hora = elemento.dataset.hora || elemento.innerText;
}

export function cambiarPaso(pasoActual, pasoDestino) {
  if (pasoActual === 1 && pasoDestino === 2) {
    if (!appointmentDraft.especialidad) return alert('Selecciona una especialidad antes de continuar.');
    cargarDoctoresEnAgendamiento(appointmentDraft.especialidad);
  }
  if (pasoActual === 2 && pasoDestino === 3 && !appointmentDraft.doctorId) {
    return alert('Selecciona un doctor antes de continuar.');
  }

  document.getElementById(`paso-${pasoActual}`)?.classList.remove('activo');
  document.getElementById(`paso-${pasoDestino}`)?.classList.add('activo');
  document.querySelectorAll('.progress-bar .step').forEach((item, index) => item.classList.toggle('activo', index < pasoDestino));
}

export async function cargarDoctoresEnAgendamiento(especialidad = appointmentDraft.especialidad || '') {
  const contenedor = document.getElementById('doctores-disponibles');
  if (!contenedor) return;

  if (!especialidad) {
    contenedor.innerHTML = View.empty('Primero selecciona una especialidad.');
    return;
  }

  setLoading(contenedor, `Cargando doctores de ${especialidad}...`);
  try {
    const doctors = await Api.doctors(especialidad);
    contenedor.innerHTML = doctors.length
      ? doctors.map(doctor => View.doctorCard(doctor)).join('')
      : View.empty(`No hay doctores activos registrados para ${especialidad}.`);
  } catch (error) {
    contenedor.innerHTML = View.empty(error.message);
  }
}

export async function cargarHorasDisponibles() {
  const grid = document.getElementById('horas-disponibles');
  const fecha = document.getElementById('fecha-cita')?.value;
  if (!grid || !appointmentDraft.doctorId || !fecha) return;

  appointmentDraft.fecha = fecha;
  setLoading(grid);
  try {
    const horas = await Api.availability(appointmentDraft.doctorId, fecha);
    grid.innerHTML = horas.length
      ? horas.map(hora => `<div class="hora-slot" onclick="seleccionarHora(this)" data-hora="${hora}">${hora}</div>`).join('')
      : View.empty('No hay horas disponibles para esta fecha.');
  } catch (error) {
    grid.innerHTML = View.empty(error.message);
  }
}

export async function confirmarReserva() {
  const fecha = document.getElementById('fecha-cita')?.value;
  appointmentDraft.fecha = fecha || appointmentDraft.fecha;

  if (!appointmentDraft.doctorId || !appointmentDraft.fecha || !appointmentDraft.hora) {
    alert('Selecciona doctor, fecha y hora antes de confirmar.');
    return;
  }

  try {
    await Api.createAppointment(appointmentDraft);
    alert('Hora agendada con éxito.');
    location.href = 'mis-citas.html';
  } catch (error) {
    alert(error.message);
  }
}

export async function cargarMisCitas() {
  const contenedor = document.getElementById('mis-citas-lista');
  if (!contenedor) return;

  setLoading(contenedor);
  try {
    const citas = await Api.appointments();
    contenedor.innerHTML = citas.length ? citas.map(cita => View.appointmentItem(cita)).join('') : View.empty('Aún no tienes citas agendadas.');
  } catch (error) {
    contenedor.innerHTML = View.empty(error.message);
  }
}

export async function cargarExamenes() {
  const contenedor = document.getElementById('mis-examenes-lista');
  if (!contenedor) return;

  setLoading(contenedor);
  try {
    const exams = await Api.exams();
    contenedor.innerHTML = exams.length
      ? exams.map(exam => `<div class="item-examen"><div class="examen-info"><h4>${View.escape(exam.nombre)}</h4><p>${View.escape(exam.fecha)}</p></div><span class="badge-estado ${exam.estado === 'Listo' ? 'badge-listo' : ''}">${View.escape(exam.estado)}</span><button class="btn-icono-descarga"><i class="fa-solid fa-file-pdf"></i></button></div>`).join('')
      : View.empty('No tienes exámenes registrados.');
  } catch (error) {
    contenedor.innerHTML = View.empty(error.message);
  }
}

export async function pintarProximaCita() {
  const box = document.getElementById('proxima-cita-box');
  if (!box) return;

  try {
    const citas = await Api.appointments();
    const cita = citas[0];
    box.innerHTML = cita ? View.appointmentItem(cita) : View.empty('No tienes próximas citas.');
  } catch (error) {
    box.innerHTML = View.empty(error.message);
  }
}
