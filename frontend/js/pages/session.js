import { Api } from '../core/api.js';
import { Store } from '../core/store.js';

export function protectRoutes() {
  const path = location.pathname;
  if (path.includes('/admin/')) Store.requireRole('admin');
  if (path.includes('/paciente/')) Store.requireRole('paciente');
  if (path.includes('/doctor/')) Store.requireRole('doctor');
}

export async function validateSession() {
  const protectedArea = ['/admin/', '/paciente/', '/doctor/'].some(segment => location.pathname.includes(segment));
  if (!protectedArea) return;

  try {
    const result = await Api.me();
    const current = Store.session;
    if (current?.token) Store.session = { token: current.token, user: result.user };
  } catch {
    Store.clear();
    location.href = Store.loginUrl();
  }
}

export function paintSession() {
  const session = Store.session;
  if (!session?.user) return;

  const { user } = session;
  const fullName = [user.nombre, user.apellido].filter(Boolean).join(' ') || user.rut || 'Usuario';

  document.querySelectorAll('.usuario-sidebar .nombre').forEach(el => { el.textContent = fullName; });
  document.querySelectorAll('.usuario-sidebar .rut').forEach(el => {
    if (user.role === 'admin') el.textContent = 'Sesión admin';
    else if (user.role === 'doctor') el.textContent = 'Sesión doctor';
    else el.textContent = user.rut || 'Paciente';
  });

  const header = document.querySelector('.header-dashboard h2');
  if (header && location.pathname.includes('/paciente/panel.html')) header.textContent = `Hola, ${user.nombre || fullName}`;

  document.querySelectorAll('[data-user="nombre-completo"]').forEach(el => { el.textContent = fullName; });
  document.querySelectorAll('[data-user="rut"]').forEach(el => { el.textContent = user.rut || 'Sin RUT'; });
  document.querySelectorAll('[data-user="telefono"]').forEach(el => { el.textContent = user.telefono || 'Sin teléfono'; });
  document.querySelectorAll('[data-user="email"]').forEach(el => { el.textContent = user.email || 'Sin correo'; });
  document.querySelectorAll('[data-user="fecha_nacimiento"]').forEach(el => { el.textContent = user.fecha_nacimiento || 'Sin fecha registrada'; });
  document.querySelectorAll('[data-user="peso_kg"]').forEach(el => { el.textContent = user.peso_kg ? `${user.peso_kg} kg` : 'Sin registrar'; });
  document.querySelectorAll('[data-user="estatura_cm"]').forEach(el => { el.textContent = user.estatura_cm ? `${user.estatura_cm} cm` : 'Sin registrar'; });
  document.querySelectorAll('[data-user="historial_medico"]').forEach(el => { el.textContent = user.historial_medico || 'Sin antecedentes registrados'; });
}

export function logout() {
  Store.clear();
  location.href = Store.loginUrl();
}
