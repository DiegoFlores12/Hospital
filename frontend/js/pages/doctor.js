import { Api } from '../core/api.js';
import { Store } from '../core/store.js';
import { View } from '../ui/view.js';

function setLoading(element, text = 'Cargando...') {
  if (element) element.innerHTML = View.empty(text);
}

export async function cargarAgendaDoctor() {
  const contenedor = document.getElementById('doctor-agenda-hoy');
  if (!contenedor) return;

  setLoading(contenedor);
  try {
    const agenda = await Api.doctorToday();
    contenedor.innerHTML = agenda.length
      ? agenda.map(item => View.doctorAppointmentRow(item)).join('')
      : View.empty('No tienes pacientes agendados para hoy.');
  } catch (error) {
    contenedor.innerHTML = View.empty(error.message);
  }
}

export async function cargarPacientesDoctor() {
  const contenedor = document.getElementById('doctor-pacientes-lista');
  if (!contenedor) return;

  setLoading(contenedor);
  try {
    const patients = await Api.doctorPatients();
    contenedor.innerHTML = patients.length
      ? patients.map(patient => View.patientRow(patient)).join('')
      : View.empty('Aún no tienes pacientes atendidos o agendados.');
  } catch (error) {
    contenedor.innerHTML = View.empty(error.message);
  }
}

export async function verFichaPaciente(patientId) {
  const detalle = document.getElementById('doctor-ficha-paciente');
  if (!detalle) return;

  setLoading(detalle, 'Cargando ficha del paciente...');
  try {
    const result = await Api.doctorPatient(patientId);
    const patient = result.patient;
    detalle.innerHTML = `
      <form id="form-ficha-paciente" data-patient-id="${patient.id}">
        <h3>${View.escape([patient.nombre, patient.apellido].filter(Boolean).join(' '))}</h3>
        <p style="color: var(--texto-secundario); margin-bottom: 15px;">RUT: ${View.escape(patient.rut)} · Nacimiento: ${View.escape(patient.fecha_nacimiento || 'Sin registrar')}</p>
        <div class="form-row">
          <div class="input-group"><i class="fa-solid fa-phone"></i><input name="telefono" value="${View.escape(patient.telefono || '')}" placeholder="Teléfono"></div>
          <div class="input-group"><i class="fa-solid fa-envelope"></i><input name="email" type="email" value="${View.escape(patient.email || '')}" placeholder="Correo"></div>
        </div>
        <div class="form-row">
          <div class="input-group"><i class="fa-solid fa-weight-scale"></i><input name="peso_kg" type="number" step="0.01" value="${View.escape(patient.peso_kg || '')}" placeholder="Peso en kg"></div>
          <div class="input-group"><i class="fa-solid fa-ruler-vertical"></i><input name="estatura_cm" type="number" step="0.01" value="${View.escape(patient.estatura_cm || '')}" placeholder="Estatura en cm"></div>
        </div>
        <div class="input-group" style="align-items:flex-start;"><i class="fa-solid fa-notes-medical"></i><textarea name="historial_medico" rows="6" placeholder="Historial médico, alergias, antecedentes, tratamientos..." style="width:100%;background:transparent;border:0;color:inherit;outline:0;resize:vertical;">${View.escape(patient.historial_medico || '')}</textarea></div>
        <button class="btn-primario btn-full" type="submit">Guardar cambios del paciente <i class="fa-solid fa-floppy-disk"></i></button>
        <div style="margin-top:20px;">
          <h4>Historial de atenciones con este doctor</h4>
          ${result.appointments.length ? result.appointments.map(item => `<p style="color: var(--texto-secundario);">${View.escape(item.fecha)} ${View.escape(item.hora)} · ${View.escape(item.especialidad || '')} · ${View.escape(item.estado || '')}</p>`).join('') : View.empty('Sin atenciones registradas.')}
        </div>
      </form>`;

    document.getElementById('form-ficha-paciente')?.addEventListener('submit', guardarFichaPaciente);
  } catch (error) {
    detalle.innerHTML = View.empty(error.message);
  }
}

async function guardarFichaPaciente(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const patientId = form.dataset.patientId;
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const result = await Api.updatePatient(patientId, data);
    const session = Store.session;
    if (session?.user?.id === result.patient.id) {
      Store.session = { ...session, user: result.patient };
    }
    alert('Ficha del paciente actualizada. Los cambios también se verán en el perfil del paciente.');
    await cargarPacientesDoctor();
    await verFichaPaciente(patientId);
  } catch (error) {
    alert(error.message);
  }
}
