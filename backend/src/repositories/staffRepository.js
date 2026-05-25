import { db } from '../config/database.js';

const staffSelect = `id, user_id, nombre, especialidad, cargo, email, telefono, estado, tipo, foto_url, to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created_at`;

export const staffRepository = {
  async listAll() {
    const { rows } = await db.query(`SELECT ${staffSelect} FROM staff ORDER BY nombre ASC`);
    return rows;
  },

  async listDoctorsBySpecialty(especialidad) {
    const { rows } = await db.query(
      `SELECT id, nombre, especialidad, cargo, email, telefono, foto_url
      FROM staff
      WHERE tipo = 'doctor' AND estado = 'activo' AND LOWER(especialidad) = LOWER($1)
      ORDER BY nombre ASC`,
      [especialidad]
    );
    return rows;
  },

  async listDoctors() {
    const { rows } = await db.query(
      `SELECT id, nombre, especialidad, cargo, email, telefono, foto_url
      FROM staff
      WHERE tipo = 'doctor' AND estado = 'activo'
      ORDER BY nombre ASC`
    );
    return rows;
  },

  async findDoctorByUserId(userId) {
    const { rows } = await db.query(
      `SELECT ${staffSelect} FROM staff WHERE user_id = $1 AND tipo = 'doctor' LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  async findDoctorByEmail(email) {
    const { rows } = await db.query(
      `SELECT ${staffSelect} FROM staff WHERE LOWER(email) = LOWER($1) AND tipo = 'doctor' LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  },


  async linkUser(staffId, userId) {
    const { rows } = await db.query(
      `UPDATE staff SET user_id = $1, updated_at = now() WHERE id = $2 RETURNING ${staffSelect}`,
      [userId, staffId]
    );
    return rows[0] || null;
  },

  async create(data) {
    const { rows } = await db.query(
      `INSERT INTO staff (user_id, nombre, especialidad, cargo, email, telefono, estado, tipo, foto_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING ${staffSelect}`,
      [data.user_id || null, data.nombre, data.especialidad || null, data.cargo || null, data.email || null, data.telefono || null, data.estado || 'activo', data.tipo || 'doctor', data.foto_url || null]
    );
    return rows[0];
  },

  async update(id, data) {
    const { rows } = await db.query(
      `UPDATE staff
      SET nombre=$1, especialidad=$2, cargo=$3, email=$4, telefono=$5, estado=$6, tipo=$7, foto_url=$8, user_id=COALESCE($9, user_id), updated_at=now()
      WHERE id=$10
      RETURNING ${staffSelect}`,
      [data.nombre, data.especialidad || null, data.cargo || null, data.email || null, data.telefono || null, data.estado || 'activo', data.tipo || 'doctor', data.foto_url || null, data.user_id || null, id]
    );
    return rows[0];
  }
};
