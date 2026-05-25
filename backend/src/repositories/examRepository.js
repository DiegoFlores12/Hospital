import { db } from '../config/database.js';

export const examRepository = {
  async listByPatient(patientId) {
    const { rows } = await db.query(
      `SELECT id, nombre, to_char(fecha, 'YYYY-MM-DD') AS fecha, estado, archivo_url
      FROM exams WHERE patient_id = $1 ORDER BY fecha DESC`,
      [patientId]
    );
    return rows;
  }
};
