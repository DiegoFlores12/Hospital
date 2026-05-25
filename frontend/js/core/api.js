import { API_BASE_URL } from './config.js';
import { Store } from './store.js';

async function request(path, options = {}) {
  const session = Store.session;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) Store.clear();
    const message = typeof body === 'object' ? body.error || 'Error de servidor' : body || 'Error de servidor';
    throw new Error(message);
  }

  return body;
}

export const Api = {
  login(payload) { return request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }); },
  register(payload) { return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }); },
  me() { return request('/auth/me'); },

  doctors(especialidad = '') {
    const query = especialidad ? `?especialidad=${encodeURIComponent(especialidad)}` : '';
    return request(`/doctors${query}`);
  },

  availability(doctorId, date) {
    return request(`/appointments/availability?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);
  },
  createAppointment(payload) { return request('/appointments', { method: 'POST', body: JSON.stringify(payload) }); },
  appointments() { return request('/appointments/my'); },
  exams() { return request('/exams/my'); },

  staff() { return request('/admin/staff'); },
  upsertStaff(payload) { return request('/admin/staff', { method: 'POST', body: JSON.stringify(payload) }); },
  updateSchedule(payload) { return request('/admin/schedules', { method: 'POST', body: JSON.stringify(payload) }); },
  updateHiring(payload) { return request('/admin/hiring', { method: 'POST', body: JSON.stringify(payload) }); },
  adminSummary() { return request('/admin/summary'); },

  doctorToday() { return request('/doctor/appointments/today'); },
  doctorPatients() { return request('/doctor/patients'); },
  doctorPatient(patientId) { return request(`/doctor/patients/${encodeURIComponent(patientId)}`); },
  updatePatient(patientId, payload) {
    return request(`/doctor/patients/${encodeURIComponent(patientId)}`, { method: 'PUT', body: JSON.stringify(payload) });
  }
};
