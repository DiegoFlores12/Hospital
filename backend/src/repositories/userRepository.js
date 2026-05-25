import { db } from '../config/database.js';

const userColumns = `id, nombre, apellido, rut, telefono, email, to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento, peso_kg, estatura_cm, historial_medico, role`;

export const userRepository = {
  async createPatient({ nombre, apellido, rut, telefono, email, fecha_nacimiento, peso_kg, estatura_cm, password_hash }) {
    const { rows } = await db.query(
      `INSERT INTO users (nombre, apellido, rut, telefono, email, fecha_nacimiento, peso_kg, estatura_cm, password_hash, role)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'paciente')
      RETURNING ${userColumns}`,
      [nombre, apellido, rut, telefono, email, fecha_nacimiento, peso_kg, estatura_cm, password_hash]
    );
    return rows[0];
  },

  async createDoctorAccount({ nombre, apellido, rut, telefono, email, password_hash }) {
    const { rows } = await db.query(
      `INSERT INTO users (nombre, apellido, rut, telefono, email, password_hash, role)
      VALUES ($1,$2,$3,$4,$5,$6,'doctor')
      RETURNING ${userColumns}`,
      [nombre, apellido, rut, telefono, email, password_hash]
    );
    return rows[0];
  },

  async findForLogin(identifier, role) {
    const { rows } = await db.query(
      `SELECT * FROM users WHERE (rut = $1 OR email = $1) AND role = $2 LIMIT 1`,
      [identifier, role]
    );
    return rows[0];
  },

  async findPublicById(id) {
    const { rows } = await db.query(`SELECT ${userColumns} FROM users WHERE id = $1 LIMIT 1`, [id]);
    return rows[0];
  },

  async findById(id) {
    const { rows } = await db.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
    return rows[0] || null;
  },

  async updatePatientMedicalData(patientId, { peso_kg, estatura_cm, historial_medico, telefono, email }) {
    const { rows } = await db.query(
      `UPDATE users
      SET peso_kg = COALESCE($2, peso_kg),
        estatura_cm = COALESCE($3, estatura_cm),
        historial_medico = COALESCE($4, historial_medico),
        telefono = COALESCE($5, telefono),
        email = COALESCE($6, email),
        updated_at = now()
      WHERE id = $1 AND role = 'paciente'
      RETURNING ${userColumns}`,
      [patientId, peso_kg, estatura_cm, historial_medico, telefono, email]
    );
    return rows[0];
  }
};
