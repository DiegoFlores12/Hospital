import { Api } from '../core/api.js';
import { View } from '../ui/view.js';

const state = { staff: [] };

function setLoading(element, text = 'Cargando...') {
  if (element) element.innerHTML = View.empty(text);
}

export async function cargarAdminPersonal() {
  const contenedor = document.getElementById('admin-personal-lista');
  if (!contenedor) return;

  setLoading(contenedor);
  try {
    state.staff = await Api.staff();
    contenedor.innerHTML = state.staff.length ? state.staff.map(persona => View.staffRow(persona)).join('') : View.empty('No hay personal registrado.');
    await cargarSelectPersonal();
  } catch (error) {
    contenedor.innerHTML = View.empty(error.message);
  }
}

export async function cargarSelectPersonal() {
  const select = document.querySelector('[name="doctor_id"]');
  if (!select) return;

  try {
    const staff = state.staff.length ? state.staff : await Api.staff();
    state.staff = staff;
    const activos = staff.filter(persona => persona.estado !== 'inactivo' && persona.tipo === 'doctor');
    select.innerHTML = activos.map(persona => `<option value="${persona.id}">${View.escape(persona.nombre)} · ${View.escape(persona.especialidad || persona.cargo || 'Doctor')}</option>`).join('');
  } catch (error) {
    select.innerHTML = `<option value="">${View.escape(error.message)}</option>`;
  }
}

export function editarPersonal(id) {
  const persona = state.staff.find(item => String(item.id) === String(id));
  if (!persona) return alert('No se encontró el trabajador en la lista cargada.');

  ['id', 'user_id', 'nombre', 'especialidad', 'cargo', 'email', 'telefono', 'estado', 'tipo', 'foto_url'].forEach(campo => {
    const input = document.querySelector(`[name="${campo}"]`);
    if (input) input.value = persona[campo] || '';
  });

  const rutInput = document.querySelector('[name="rut_acceso"]');
  const passwordInput = document.querySelector('[name="password_acceso"]');
  if (rutInput) rutInput.value = '';
  if (passwordInput) passwordInput.value = '';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export async function guardarPersonal(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());

  try {
    await Api.upsertStaff(data);
    alert(data.id ? 'Información del trabajador modificada.' : 'Nuevo trabajador agregado.');
    event.target.reset();
    await cargarAdminPersonal();
    await cargarSelectPersonal();
  } catch (error) {
    alert(error.message);
  }
}

export async function guardarHorario(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());

  try {
    await Api.updateSchedule(data);
    alert('Horario guardado y disponibilidad generada.');
  } catch (error) {
    alert(error.message);
  }
}

export async function guardarContratacion(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());

  try {
    const result = await Api.updateHiring(data);
    alert(result?.staff ? 'Candidato contratado y agregado al personal.' : 'Decisión de contratación registrada.');
    event.target.reset();
  } catch (error) {
    alert(error.message);
  }
}

export async function pintarResumenAdmin() {
  const personal = document.getElementById('admin-total-personal');
  const horarios = document.getElementById('admin-total-horarios');
  const contratacion = document.getElementById('admin-total-contratacion');
  if (!personal && !horarios && !contratacion) return;

  try {
    const summary = await Api.adminSummary();
    if (personal) personal.textContent = summary.personal_activo;
    if (horarios) horarios.textContent = summary.horarios_semana;
    if (contratacion) contratacion.textContent = summary.contratacion_pendiente;
  } catch {
    if (personal) personal.textContent = '-';
    if (horarios) horarios.textContent = '-';
    if (contratacion) contratacion.textContent = '-';
  }
}

export function setupAdminForms() {
  document.getElementById('form-personal')?.addEventListener('submit', guardarPersonal);
  document.getElementById('form-horario')?.addEventListener('submit', guardarHorario);
  document.getElementById('form-contratacion')?.addEventListener('submit', guardarContratacion);
}
