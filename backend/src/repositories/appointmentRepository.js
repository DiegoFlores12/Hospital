import { db } from '../config/database.js';

export const appointmentRepository = {
  async listPatientAppointments(patientId) {
    const { rows } = await db.query(
      `SELECT a.id, to_char(a.fecha, 'YYYY-MM-DD') AS fecha, to_char(a.hora, 'HH24:MI') AS hora, a.estado, a.modalidad, a.ubicacion,
              s.nombre AS doctor_nombre, s.especialidad
      FROM appointments a
      JOIN staff s ON s.id = a.doctor_id
      WHERE a.patient_id = $1
      ORDER BY a.fecha ASC, a.hora ASC`,
      [patientId]
    );
    return rows;
  },

  async listDoctorAppointmentsToday(doctorId) {
    const { rows } = await db.query(
      `SELECT a.id, to_char(a.fecha, 'YYYY-MM-DD') AS fecha, to_char(a.hora, 'HH24:MI') AS hora, a.estado, s.especialidad,
              u.id AS patient_id, concat_ws(' ', u.nombre, u.apellido) AS patient_name, u.rut
      FROM appointments a
      JOIN users u ON u.id = a.patient_id
      JOIN staff s ON s.id = a.doctor_id
      WHERE a.doctor_id = $1 AND a.fecha = CURRENT_DATE
      ORDER BY a.hora ASC`,
      [doctorId]
    );
    return rows;
  },

  async listDoctorPatients(doctorId) {
    const { rows } = await db.query(
      `SELECT DISTINCT ON (u.id) u.id, concat_ws(' ', u.nombre, u.apellido) AS nombre, u.rut, u.telefono, u.email,
              u.peso_kg, u.estatura_cm, u.historial_medico,
              to_char(a.fecha, 'YYYY-MM-DD') AS ultima_atencion, s.especialidad
      FROM appointments a
      JOIN users u ON u.id = a.patient_id
      JOIN staff s ON s.id = a.doctor_id
      WHERE a.doctor_id = $1
      ORDER BY u.id, a.fecha DESC, a.hora DESC`,
      [doctorId]
    );
    return rows;
  },

  async getDoctorPatient(doctorId, patientId) {
    const { rows } = await db.query(
      `SELECT u.id, u.nombre, u.apellido, u.rut, u.telefono, u.email,
              to_char(u.fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
              u.peso_kg, u.estatura_cm, u.historial_medico
      FROM users u
      WHERE u.id = $2 AND u.role = 'paciente'
        AND EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = u.id AND a.doctor_id = $1)
      LIMIT 1`,
      [doctorId, patientId]
    );
    return rows[0];
  },

  async getDoctorPatientHistory(doctorId, patientId) {
    const { rows } = await db.query(
      `SELECT a.id, to_char(a.fecha, 'YYYY-MM-DD') AS fecha, to_char(a.hora, 'HH24:MI') AS hora, a.estado, s.especialidad, s.nombre AS doctor_nombre
      FROM appointments a
      JOIN staff s ON s.id = a.doctor_id
      WHERE a.patient_id = $2 AND a.doctor_id = $1
      ORDER BY a.fecha DESC, a.hora DESC`,
      [doctorId, patientId]
    );
    return rows;
  }
};
