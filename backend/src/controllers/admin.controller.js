import { db } from '../config/database.js';
import { staffRepository } from '../repositories/staffRepository.js';
import { staffService } from '../services/staffService.js';
import { isBlank } from '../utils/validation.js';

export const adminController = {
  async staffList(_req, res, next) {
    try {
      res.json(await staffRepository.listAll());
    } catch (error) {
      next(error);
    }
  },

  async saveStaff(req, res, next) {
    try {
      const saved = await staffService.saveStaff(req.body);
      if (!saved) return res.status(404).json({ error: 'Trabajador no encontrado' });
      res.status(req.body.id ? 200 : 201).json(saved);
    } catch (error) {
      next(error);
    }
  },

  async saveSchedule(req, res, next) {
    const client = await db.connect();
    try {
      const { doctor_id, fecha, inicio, fin, ubicacion } = req.body;
      if ([doctor_id, fecha, inicio, fin].some(isBlank)) {
        return res.status(400).json({ error: 'Trabajador, fecha, inicio y fin son obligatorios' });
      }

      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO work_schedules (doctor_id, fecha, inicio, fin, ubicacion)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [doctor_id, fecha, inicio, fin, ubicacion || null]
      );

      await client.query(
        `INSERT INTO availability_slots (doctor_id, slot_date, slot_time)
        SELECT $1, $2::date, gs::time
        FROM generate_series($3::time, ($4::time - interval '30 minutes'), interval '30 minutes') AS gs
        ON CONFLICT DO NOTHING`,
        [doctor_id, fecha, inicio, fin]
      );

      await client.query('COMMIT');
      res.status(201).json(rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  },

  async hiring(req, res, next) {
    const client = await db.connect();
    try {
      const { nombre, especialidad, email, decision, observacion } = req.body;
      if ([nombre, especialidad, decision].some(isBlank)) {
        return res.status(400).json({ error: 'Nombre, especialidad y decisión son obligatorios' });
      }

      await client.query('BEGIN');
      const { rows: requestRows } = await client.query(
        `INSERT INTO hiring_requests (nombre, especialidad, email, decision, observacion)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [nombre, especialidad, email || null, decision, observacion || null]
      );

      let staff = null;
      if (decision === 'contratar') {
        const { rows } = await client.query(
          `INSERT INTO staff (nombre, especialidad, cargo, email, estado, tipo)
           VALUES ($1,$2,$3,$4,'activo','doctor') RETURNING *`,
          [nombre, especialidad, 'Doctor/a', email || null]
        );
        staff = rows[0];
      }

      await client.query('COMMIT');
      res.status(201).json({ request: requestRows[0], staff });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  },

  async summary(_req, res, next) {
    try {
      const [personal, horarios, contratacion] = await Promise.all([
        db.query("SELECT count(*)::int AS total FROM staff WHERE estado = 'activo'"),
        db.query("SELECT count(*)::int AS total FROM availability_slots WHERE slot_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND is_booked = false"),
        db.query("SELECT count(*)::int AS total FROM hiring_requests WHERE decision = 'pendiente'")
      ]);

      res.json({
        personal_activo: personal.rows[0].total,
        horarios_semana: horarios.rows[0].total,
        contratacion_pendiente: contratacion.rows[0].total
      });
    } catch (error) {
      next(error);
    }
  }
};
