import { setupAuthForms } from './pages/auth.js';
import { setupHome } from './pages/home.js';
import { protectRoutes, validateSession, paintSession, logout } from './pages/session.js';
import {
  seleccionarEspecialidad,
  seleccionarDoctor,
  seleccionarHora,
  cambiarPaso,
  confirmarReserva,
  cargarHorasDisponibles,
  cargarMisCitas,
  cargarExamenes,
  pintarProximaCita
} from './pages/patient.js';
import {
  editarPersonal,
  cargarAdminPersonal,
  cargarSelectPersonal,
  pintarResumenAdmin,
  setupAdminForms
} from './pages/admin.js';
import { cargarAgendaDoctor, cargarPacientesDoctor, verFichaPaciente } from './pages/doctor.js';

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
}

function currentArea() {
  const path = location.pathname;
  if (path.includes('/admin/')) return 'admin';
  if (path.includes('/paciente/')) return 'paciente';
  if (path.includes('/doctor/')) return 'doctor';
  return 'public';
}

async function bootPatientPage() {
  await Promise.allSettled([
    cargarMisCitas(),
    cargarExamenes(),
    pintarProximaCita()
  ]);
  document.getElementById('fecha-cita')?.addEventListener('change', cargarHorasDisponibles);
}

async function bootAdminPage() {
  setupAdminForms();
  await Promise.allSettled([
    cargarAdminPersonal(),
    cargarSelectPersonal(),
    pintarResumenAdmin()
  ]);
}

async function bootDoctorPage() {
  await Promise.allSettled([
    cargarAgendaDoctor(),
    cargarPacientesDoctor()
  ]);
}

Object.assign(window, {
  togglePassword,
  logout,
  seleccionarEspecialidad,
  seleccionarDoctor,
  seleccionarHora,
  cambiarPaso,
  confirmarReserva,
  editarPersonal,
  verFichaPaciente
});

document.addEventListener('DOMContentLoaded', async () => {
  protectRoutes();
  await validateSession();
  paintSession();

  setupAuthForms();
  setupHome();

  const area = currentArea();
  if (area === 'paciente') await bootPatientPage();
  if (area === 'admin') await bootAdminPage();
  if (area === 'doctor') await bootDoctorPage();
});
