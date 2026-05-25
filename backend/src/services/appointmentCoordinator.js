import { db } from '../config/database.js';

export class AppointmentCoordinator {
  constructor(pool = db) {
    this.pool = pool;
  }

  async schedule({ patientId, doctorId, fecha, hora }) {
    try {
      await client.query('BEGIN');

      const { rows: slots } = await client.query(
        `SELECT id FROM availability_slots
        WHERE doctor_id=$1 AND slot_date=$2 AND slot_time=$3 AND is_booked=false
        FOR UPDATE`,
        [doctorId, fecha, hora]
      );
      if (!slots[0]) {
        const error = new Error('La hora seleccionada no está disponible');
        error.statusCode = 409;
        throw error;
      }

      const { rows } = await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, fecha, hora, estado, modalidad, ubicacion)
        VALUES ($1,$2,$3,$4,'confirmada','Presencial','Hospital Mágico')
        RETURNING *`,
        [patientId, doctorId, fecha, hora]
      );

      await client.query('UPDATE availability_slots SET is_booked=true WHERE id=$1', [slots[0].id]);
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
