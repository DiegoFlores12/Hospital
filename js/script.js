const API_BASE_URL = window.HOSPITAL_API_URL || 'http://localhost:3000/api';

const datosEspecialidades = [
    { titulo: "Urgencias y Rescate", texto: "Atención crítica inmediata 24/7. Nuestro equipo está altamente capacitado en maniobras de reanimación cardiopulmonar (RCP) y protocolos de seguridad, incluyendo el manejo avanzado de extintores.", img: "https://images.unsplash.com/photo-1587559070757-f72a388edbba?auto=format&fit=crop&w=1200&q=80" },
    { titulo: "Cardiología", texto: "Monitoreo, prevención y cirugía cardiovascular con la más alta tecnología. Realizamos estudios avanzados y procedimientos mínimamente invasivos para cuidar el motor de tu cuerpo con precisión.", img: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80" },
    { titulo: "Pediatría", texto: "Un entorno mágico y seguro diseñado especialmente para la recuperación y el bienestar de los más pequeños. Atención compasiva y especializada desde el nacimiento hasta la adolescencia.", img: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80" },
    { titulo: "Neurología", texto: "Especialistas en el sistema nervioso central y periférico. Brindamos diagnósticos precisos mediante neuroimagen avanzada para tratamientos efectivos de trastornos neurológicos.", img: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80" },
    { titulo: "Traumatología", texto: "Rehabilitación y cirugía ortopédica integral. Nuestro objetivo es que recuperes tu movilidad y calidad de vida al máximo a través de terapias personalizadas e intervenciones seguras.", img: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80" },
    { titulo: "Oftalmología", texto: "Protegemos tu visión con evaluaciones oftalmológicas detalladas, diagnósticos precisos y cirugías láser de última generación para una recuperación visual rápida y efectiva.", img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1200&q=80" }
];

const AppState = { staff: [], nextAppointment: null, doctors: [] };

const Store = {
    get session() {
        try { return JSON.parse(localStorage.getItem('hospital_session') || 'null'); }
        catch { return null; }
    },
    set session(value) { localStorage.setItem('hospital_session', JSON.stringify(value)); },
    clear() { localStorage.removeItem('hospital_session'); },
    loginUrl() {
        return location.pathname.includes('/admin/') || location.pathname.includes('/paciente/') || location.pathname.includes('/doctor/') ? '../login.html' : 'login.html';
    },
    requireRole(role) {
        const session = this.session;
        if (!session?.token || session?.user?.role !== role) {
            this.clear();
            location.href = this.loginUrl();
            return null;
        }
        return session;
    }
};

const Api = {
    async request(path, options = {}) {
        const session = Store.session;
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        if (session?.token) headers.Authorization = `Bearer ${session.token}`;
        const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
        const contentType = res.headers.get('content-type') || '';
        const body = contentType.includes('application/json') ? await res.json() : await res.text();
        if (!res.ok) {
            const message = typeof body === 'object' ? body.error || 'Error de servidor' : body || 'Error de servidor';
            if (res.status === 401 || res.status === 403) Store.clear();
            throw new Error(message);
        }
        return body;
    },
    login(payload) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }); },
    register(payload) { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }); },
    me() { return this.request('/auth/me'); },
    doctors(especialidad = '') {
        const query = especialidad ? `?especialidad=${encodeURIComponent(especialidad)}` : '';
        return this.request(`/doctors${query}`);
    },
    staff() { return this.request('/admin/staff'); },
    appointments() { return this.request('/appointments/my'); },
    exams() { return this.request('/exams/my'); },
    availability(doctorId, date) { return this.request(`/availability?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`); },
    createAppointment(payload) { return this.request('/appointments', { method: 'POST', body: JSON.stringify(payload) }); },
    upsertStaff(payload) { return this.request('/admin/staff', { method: 'POST', body: JSON.stringify(payload) }); },
    updateSchedule(payload) { return this.request('/admin/schedules', { method: 'POST', body: JSON.stringify(payload) }); },
    updateHiring(payload) { return this.request('/admin/hiring', { method: 'POST', body: JSON.stringify(payload) }); },
    adminSummary() { return this.request('/admin/summary'); }
};

const View = {
    escape(value = '') {
        return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
    },
    doctorCard(doctor) {
        return `<div class="card-opcion doctor-card" data-doctor-id="${doctor.id}" onclick="seleccionarDoctor(this)">
            <img src="${this.escape(doctor.foto_url || 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=150&q=80')}" alt="${this.escape(doctor.nombre)}">
            <h4>${this.escape(doctor.nombre)}</h4><p>${this.escape(doctor.especialidad || 'Medicina general')}</p>
        </div>`;
    },
    staffRow(persona) {
        const badge = persona.estado === 'activo' ? 'badge-confirmada' : '';
        return `<div class="item-examen">
            <div class="examen-info"><h4>${this.escape(persona.nombre)}</h4><p>${this.escape(persona.cargo || 'Profesional')} · ${this.escape(persona.especialidad || 'Sin especialidad')} · ${this.escape(persona.email || 'Sin correo')}</p></div>
            <span class="badge-estado ${badge}">${this.escape(persona.estado || 'activo')}</span>
            <button class="btn-secundario btn-sm" onclick="editarPersonal('${persona.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
        </div>`;
    },
    appointmentItem(cita) {
        const fecha = new Date(`${cita.fecha}T00:00:00`);
        const mes = Number.isNaN(fecha.getTime()) ? '--' : fecha.toLocaleString('es-CL', { month: 'short' }).toUpperCase().replace('.', '');
        const dia = Number.isNaN(fecha.getTime()) ? '--' : String(fecha.getDate()).padStart(2, '0');
        return `<div class="info-cita-destacada" style="border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:20px;">
            <div class="fecha-box"><span class="mes">${mes}</span><span class="dia">${dia}</span></div>
            <div class="detalles-cita" style="flex:1;"><h4>${this.escape(cita.doctor_nombre)}</h4><p class="especialidad">${this.escape(cita.especialidad || '')}</p><p class="hora-lugar"><i class="fa-regular fa-clock"></i> ${this.escape(cita.hora)} &nbsp; | &nbsp; <i class="fa-solid fa-location-dot"></i> ${this.escape(cita.ubicacion || cita.modalidad || '')}</p></div>
            <span class="badge-estado ${cita.estado === 'confirmada' ? 'badge-confirmada' : ''}">${this.escape(cita.estado || '')}</span>
        </div>`;
    },
    empty(message) { return `<p style="color: var(--texto-secundario);">${this.escape(message)}</p>`; }
};

let indiceActual = 0;
let intervaloRotacion;
let timeoutPausa;
const TIEMPO_ROTACION = 4000;
const TIEMPO_PAUSA_CLICK = 10000;
const tabs = document.querySelectorAll('.tab-item');
const indicador = document.getElementById('indicador');
const appointmentDraft = {};

function moverIndicador(elementoActivo) {
    if (elementoActivo && indicador) {
        indicador.style.width = elementoActivo.offsetWidth + 'px';
        indicador.style.left = elementoActivo.offsetLeft + 'px';
    }
}

function actualizarVisual(indice, elementoHover = null) {
    if (!tabs.length) return;
    const elementoActivo = elementoHover || tabs[indice];
    tabs.forEach(tab => tab.classList.remove('activo'));
    elementoActivo.classList.add('activo');
    moverIndicador(elementoActivo);
    const pod = document.getElementById('pod-imagen');
    if (pod) pod.style.backgroundImage = `url('${datosEspecialidades[indice].img}')`;
    const panelInfo = document.getElementById('info-panel');
    const titulo = document.getElementById('info-titulo');
    const texto = document.getElementById('info-texto');
    if (panelInfo && titulo && texto) {
        panelInfo.classList.remove('visible');
        setTimeout(() => {
            titulo.innerText = datosEspecialidades[indice].titulo;
            texto.innerText = datosEspecialidades[indice].texto;
            panelInfo.classList.add('visible');
        }, 150);
    }
    indiceActual = indice;
}

function iniciarAutoPlay() {
    clearInterval(intervaloRotacion);
    intervaloRotacion = setInterval(() => actualizarVisual((indiceActual + 1) % datosEspecialidades.length), TIEMPO_ROTACION);
}
function detenerAutoPlay() { clearInterval(intervaloRotacion); }

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
}

function cambiarPaso(pasoActual, pasoDestino) {
    if (pasoActual === 1 && pasoDestino === 2) {
        if (!appointmentDraft.especialidad) return alert('Selecciona una especialidad antes de continuar.');
        cargarDoctoresEnAgendamiento(appointmentDraft.especialidad);
    }
    if (pasoActual === 2 && pasoDestino === 3 && !appointmentDraft.doctorId) {
        return alert('Selecciona un doctor antes de continuar.');
    }

    const stepActual = document.getElementById('paso-' + pasoActual);
    if (stepActual) stepActual.classList.remove('activo');
    const stepDestino = document.getElementById('paso-' + pasoDestino);
    if (stepDestino) stepDestino.classList.add('activo');
    document.querySelectorAll('.progress-bar .step').forEach((item, index) => item.classList.toggle('activo', index < pasoDestino));
}

function seleccionarOpcion(elemento) {
    const hermanos = elemento.parentElement.querySelectorAll('.card-opcion, .hora-slot');
    hermanos.forEach(hermano => hermano.classList.remove('seleccionado'));
    elemento.classList.add('seleccionado');
}

function seleccionarEspecialidad(elemento) {
    seleccionarOpcion(elemento);
    appointmentDraft.especialidad = elemento.dataset.especialidad || elemento.querySelector('h4')?.innerText || '';
    appointmentDraft.doctorId = null;
    appointmentDraft.doctorName = null;
    appointmentDraft.hora = null;
    const doctores = document.getElementById('doctores-disponibles');
    if (doctores) doctores.innerHTML = View.empty(`Presiona Siguiente para ver doctores de ${appointmentDraft.especialidad}.`);
    const horas = document.getElementById('horas-disponibles');
    if (horas) horas.innerHTML = View.empty('Selecciona doctor y fecha para cargar horarios.');
}

function seleccionarDoctor(elemento) {
    seleccionarOpcion(elemento);
    appointmentDraft.doctorId = elemento.dataset.doctorId;
    appointmentDraft.doctorName = elemento.querySelector('h4')?.innerText;
    appointmentDraft.hora = null;
    const horas = document.getElementById('horas-disponibles');
    if (horas) horas.innerHTML = View.empty('Selecciona fecha para cargar horarios.');
    cargarHorasDisponibles();
}

function seleccionarHora(elemento) {
    seleccionarOpcion(elemento);
    appointmentDraft.hora = elemento.dataset.hora || elemento.innerText;
}

function setLoading(element, text = 'Cargando...') {
    if (element) element.innerHTML = View.empty(text);
}

async function cargarDoctoresEnAgendamiento(especialidad = appointmentDraft.especialidad || '') {
    const contenedor = document.getElementById('doctores-disponibles');
    if (!contenedor) return;

    if (!especialidad) {
        contenedor.innerHTML = View.empty('Primero selecciona una especialidad.');
        return;
    }

    setLoading(contenedor, `Cargando doctores de ${especialidad}...`);
    try {
        const doctors = await Api.doctors(especialidad);
        AppState.doctors = doctors;
        contenedor.innerHTML = doctors.length
            ? doctors.map(d => View.doctorCard(d)).join('')
            : View.empty(`No hay doctores activos registrados para ${especialidad}.`);
    } catch (error) {
        contenedor.innerHTML = View.empty(error.message);
    }
}

async function cargarHorasDisponibles() {
    const grid = document.getElementById('horas-disponibles');
    const fecha = document.getElementById('fecha-cita')?.value;
    if (!grid || !appointmentDraft.doctorId || !fecha) return;
    appointmentDraft.fecha = fecha;
    setLoading(grid);
    try {
        const horas = await Api.availability(appointmentDraft.doctorId, fecha);
        grid.innerHTML = horas.length ? horas.map(hora => `<div class="hora-slot" onclick="seleccionarHora(this)" data-hora="${hora}">${hora}</div>`).join('') : View.empty('No hay horas disponibles para esta fecha.');
    } catch (error) {
        grid.innerHTML = View.empty(error.message);
    }
}

async function confirmarReserva() {
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

async function cargarMisCitas() {
    const contenedor = document.getElementById('mis-citas-lista');
    if (!contenedor) return;
    setLoading(contenedor);
    try {
        const citas = await Api.appointments();
        AppState.nextAppointment = citas[0] || null;
        contenedor.innerHTML = citas.length ? citas.map(c => View.appointmentItem(c)).join('') : View.empty('Aún no tienes citas agendadas.');
        pintarProximaCita();
    } catch (error) {
        contenedor.innerHTML = View.empty(error.message);
    }
}

async function cargarExamenes() {
    const contenedor = document.getElementById('mis-examenes-lista');
    if (!contenedor) return;
    setLoading(contenedor);
    try {
        const exams = await Api.exams();
        contenedor.innerHTML = exams.length ? exams.map(ex => `<div class="item-examen"><div class="examen-info"><h4>${View.escape(ex.nombre)}</h4><p>${View.escape(ex.fecha)}</p></div><span class="badge-estado ${ex.estado === 'Listo' ? 'badge-listo' : ''}">${View.escape(ex.estado)}</span><button class="btn-icono-descarga"><i class="fa-solid fa-file-pdf"></i></button></div>`).join('') : View.empty('No tienes exámenes registrados.');
    } catch (error) {
        contenedor.innerHTML = View.empty(error.message);
    }
}

async function cargarAdminPersonal() {
    const contenedor = document.getElementById('admin-personal-lista');
    if (!contenedor) return;
    setLoading(contenedor);
    try {
        const staff = await Api.staff();
        AppState.staff = staff;
        contenedor.innerHTML = staff.length ? staff.map(p => View.staffRow(p)).join('') : View.empty('No hay personal registrado.');
        cargarSelectPersonal();
    } catch (error) {
        contenedor.innerHTML = View.empty(error.message);
    }
}

async function cargarSelectPersonal() {
    const select = document.querySelector('[name="doctor_id"]');
    if (!select) return;
    try {
        const staff = AppState.staff.length ? AppState.staff : await Api.staff();
        AppState.staff = staff;
        const activos = staff.filter(p => p.estado !== 'inactivo');
        select.innerHTML = activos.map(p => `<option value="${p.id}">${View.escape(p.nombre)} · ${View.escape(p.especialidad || p.cargo || 'Profesional')}</option>`).join('');
    } catch (error) {
        select.innerHTML = `<option value="">${View.escape(error.message)}</option>`;
    }
}

function editarPersonal(id) {
    const persona = AppState.staff.find(d => String(d.id) === String(id));
    if (!persona) return alert('No se encontró el trabajador en la lista cargada.');
    ['nombre', 'especialidad', 'cargo', 'email', 'telefono', 'estado', 'tipo', 'foto_url'].forEach(campo => {
        const input = document.querySelector(`[name="${campo}"]`);
        if (input) input.value = persona[campo] || '';
    });
    const idInput = document.querySelector('[name="id"]');
    if (idInput) idInput.value = persona.id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function guardarPersonal(event) {
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

async function guardarHorario(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    try {
        await Api.updateSchedule(data);
        alert('Horario guardado y disponibilidad generada.');
    } catch (error) {
        alert(error.message);
    }
}

async function guardarContratacion(event) {
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

function logout() {
    Store.clear();
    location.href = Store.loginUrl();
}

function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async event => {
            event.preventDefault();
            const data = Object.fromEntries(new FormData(loginForm).entries());
            try {
                const response = await Api.login(data);
                Store.session = { token: response.token, user: response.user };
                location.href = response.user.role === 'admin' ? 'admin/panel.html' : 'paciente/panel.html';
            } catch (error) {
                Store.clear();
                alert(error.message);
            }
        });
    }
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async event => {
            event.preventDefault();
            const data = Object.fromEntries(new FormData(registerForm).entries());
            if (data.password !== data.password_confirm) return alert('Las contraseñas no coinciden.');
            data.fecha_nacimiento = `${data.anio}-${String(data.mes).padStart(2, '0')}-${String(data.dia).padStart(2, '0')}`;
            delete data.password_confirm; delete data.dia; delete data.mes; delete data.anio;
            try {
                await Api.register(data);
                alert('Registro creado. Ahora puedes iniciar sesión.');
                location.href = 'login.html';
            } catch (error) {
                alert(error.message);
            }
        });
    }
}

function protegerRutas() {
    const path = location.pathname;
    if (path.includes('/admin/')) Store.requireRole('admin');
    if (path.includes('/paciente/')) Store.requireRole('paciente');
}

async function validarSesionConServidor() {
    const path = location.pathname;
    if (!path.includes('/admin/') && !path.includes('/paciente/')) return;
    try {
        const result = await Api.me();
        const current = Store.session;
        if (current?.token) Store.session = { token: current.token, user: result.user };
    } catch {
        Store.clear();
        location.href = Store.loginUrl();
    }
}

function pintarSesionUsuario() {
    const session = Store.session;
    if (!session?.user) return;
    const user = session.user;
    const fullName = [user.nombre, user.apellido].filter(Boolean).join(' ') || user.rut || 'Usuario';
    document.querySelectorAll('.usuario-sidebar .nombre').forEach(el => el.textContent = fullName);
    document.querySelectorAll('.usuario-sidebar .rut').forEach(el => el.textContent = user.role === 'admin' ? 'Sesión admin' : (user.rut || 'Paciente'));

    const header = document.querySelector('.header-dashboard h2');
    if (header && location.pathname.includes('/paciente/panel.html')) header.textContent = `Hola, ${user.nombre || fullName}`;

    const perfilNombre = document.querySelector('[data-user="nombre-completo"]');
    if (perfilNombre) perfilNombre.textContent = fullName;
    const perfilRut = document.querySelector('[data-user="rut"]');
    if (perfilRut) perfilRut.textContent = user.rut || 'Sin RUT';
    const perfilTelefono = document.querySelector('[data-user="telefono"]');
    if (perfilTelefono) perfilTelefono.textContent = user.telefono || 'Sin teléfono';
    const perfilEmail = document.querySelector('[data-user="email"]');
    if (perfilEmail) perfilEmail.textContent = user.email || 'Sin correo';
}

async function pintarProximaCita() {
    const box = document.getElementById('proxima-cita-box');
    if (!box) return;
    try {
        const citas = await Api.appointments();
        const cita = citas[0];
        if (!cita) {
            box.innerHTML = View.empty('No tienes próximas citas.');
            return;
        }
        box.innerHTML = View.appointmentItem(cita);
    } catch (error) {
        box.innerHTML = View.empty(error.message);
    }
}

async function pintarResumenAdmin() {
    const personal = document.getElementById('admin-total-personal');
    const horarios = document.getElementById('admin-total-horarios');
    const contratacion = document.getElementById('admin-total-contratacion');
    if (!personal && !horarios && !contratacion) return;
    try {
        const summary = await Api.adminSummary();
        if (personal) personal.textContent = summary.personal_activo;
        if (horarios) horarios.textContent = summary.horarios_semana;
        if (contratacion) contratacion.textContent = summary.contratacion_pendiente;
    } catch (error) {
        if (personal) personal.textContent = '-';
        if (horarios) horarios.textContent = '-';
        if (contratacion) contratacion.textContent = '-';
    }
}

function setupHome() {
    tabs.forEach((item, index) => {
        item.addEventListener('mouseenter', () => { detenerAutoPlay(); clearTimeout(timeoutPausa); actualizarVisual(index, item); });
        item.addEventListener('mouseleave', iniciarAutoPlay);
        item.addEventListener('click', () => {
            detenerAutoPlay(); actualizarVisual(index, item); clearTimeout(timeoutPausa);
            timeoutPausa = setTimeout(iniciarAutoPlay, TIEMPO_PAUSA_CLICK);
        });
    });
    const counters = document.querySelectorAll('.counter');
    const animateCounters = () => counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText.replace('+', '');
            const inc = target / 200;
            if (count < target) { counter.innerText = Math.ceil(count + inc); setTimeout(updateCount, 20); }
            else { counter.innerText = target + (target > 100 ? '+' : ''); }
        };
        updateCount();
    });
    const statsSection = document.querySelector('.seccion-stats');
    if (statsSection && 'IntersectionObserver' in window) {
        new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => { if (entry.isIntersecting) { animateCounters(); observer.unobserve(entry.target); } });
        }, { root: null, threshold: 0.1 }).observe(statsSection);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    protegerRutas();
    await validarSesionConServidor();
    pintarSesionUsuario();
    setupAuthForms();
    setupHome();
    cargarDoctoresEnAgendamiento();
    cargarMisCitas();
    cargarExamenes();
    cargarAdminPersonal();
    cargarSelectPersonal();
    pintarProximaCita();
    pintarResumenAdmin();

    const fechaCita = document.getElementById('fecha-cita');
    if (fechaCita) fechaCita.addEventListener('change', cargarHorasDisponibles);

    const personalForm = document.getElementById('form-personal');
    if (personalForm) personalForm.addEventListener('submit', guardarPersonal);
    const horarioForm = document.getElementById('form-horario');
    if (horarioForm) horarioForm.addEventListener('submit', guardarHorario);
    const contratacionForm = document.getElementById('form-contratacion');
    if (contratacionForm) contratacionForm.addEventListener('submit', guardarContratacion);

    if (tabs.length > 0) {
        moverIndicador(tabs[0]);
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) infoPanel.classList.add('visible');
        iniciarAutoPlay();
    }
});

window.addEventListener('resize', () => { if (tabs.length > 0) moverIndicador(tabs[indiceActual]); });
