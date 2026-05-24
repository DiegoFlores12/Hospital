/**
 * Patrón ESTRUCTURAL: Facade.
 * Expone una operación simple para agendar cita, ocultando la transacción,
 * el bloqueo del horario y la inserción de la cita.
 */
class AppointmentFacade {
  constructor(pool) {
    this.pool = pool;
  }

  async scheduleAppointment({ patientId, doctorId, fecha, hora }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const slot = await client.query(
        `UPDATE availability_slots SET is_booked = true
        WHERE doctor_id = $1 AND slot_date = $2 AND slot_time = $3 AND is_booked = false
        RETURNING id`,
        [doctorId, fecha, hora]
      );

      if (!slot.rowCount) {
        await client.query('ROLLBACK');
        const error = new Error('El horario ya no está disponible');
        error.statusCode = 409;
        throw error;
      }

      const { rows } = await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, fecha, hora, estado, modalidad, ubicacion)
         VALUES ($1,$2,$3,$4,'confirmada','Presencial','Hospital Mágico') RETURNING *`,
        [patientId, doctorId, fecha, hora]
      );

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* rollback ya ejecutado */ }
      throw error;
    } finally {
      client.release();
    }
  }
}

export { AppointmentFacade };
