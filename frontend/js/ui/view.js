export const View = {
  escape(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
  },

  empty(message) {
    return `<p style="color: var(--texto-secundario);">${this.escape(message)}</p>`;
  },

  doctorCard(doctor) {
    const icon = '<div class="avatar"><i class="fa-solid fa-user-doctor"></i></div>';
    return `<div class="card-opcion doctor-card" data-doctor-id="${doctor.id}" onclick="seleccionarDoctor(this)">
      ${doctor.foto_url ? `<img src="${this.escape(doctor.foto_url)}" alt="${this.escape(doctor.nombre)}">` : icon}
      <h4>${this.escape(doctor.nombre)}</h4>
      <p>${this.escape(doctor.especialidad || 'Medicina general')}</p>
    </div>`;
  },

  staffRow(persona) {
    const badge = persona.estado === 'activo' ? 'badge-confirmada' : '';
    const userStatus = persona.user_id ? ' · acceso doctor activo' : '';
    return `<div class="item-examen">
      <div class="examen-info"><h4>${this.escape(persona.nombre)}</h4><p>${this.escape(persona.cargo || 'Profesional')} · ${this.escape(persona.especialidad || 'Sin especialidad')} · ${this.escape(persona.email || 'Sin correo')}${userStatus}</p></div>
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

  patientRow(patient) {
    return `<div class="item-examen">
      <div class="examen-info"><h4>${this.escape(patient.nombre)}</h4><p>RUT: ${this.escape(patient.rut)} · Última atención: ${this.escape(patient.ultima_atencion || 'Sin registro')}</p></div>
      <button class="btn-secundario btn-sm" onclick="verFichaPaciente('${patient.id}')"><i class="fa-solid fa-file-medical"></i> Ver ficha</button>
    </div>`;
  },

  doctorAppointmentRow(item) {
    return `<div class="item-examen">
      <div class="examen-info"><h4>${this.escape(item.patient_name)}</h4><p>${this.escape(item.hora)} · ${this.escape(item.especialidad || '')} · RUT: ${this.escape(item.rut)}</p></div>
      <span class="badge-estado badge-confirmada">${this.escape(item.estado || 'confirmada')}</span>
    </div>`;
  }
};
