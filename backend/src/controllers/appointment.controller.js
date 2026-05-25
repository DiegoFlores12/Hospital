import { db } from '../config/database.js';
import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { AppointmentCoordinator } from '../services/appointmentCoordinator.js';
import { isBlank } from '../utils/validation.js';

const coordinator = new AppointmentCoordinator(db);

export const appointmentController = {
  async myAppointments(req, res, next) {
    try {
      res.json(await appointmentRepository.listPatientAppointments(req.user.id));
    } catch (error) {
      next(error);
    }
  },

  async availability(req, res, next) {
    try {
      const { doctorId, date } = req.query;
      if (!doctorId || !date) return res.status(400).json({ error: 'doctorId y date son requeridos' });

      const { rows } = await db.query(
        `SELECT to_char(slot_time, 'HH24:MI') AS hora
        FROM availability_slots
        WHERE doctor_id = $1 AND slot_date = $2 AND is_booked = false
        ORDER BY slot_time ASC`,
        [doctorId, date]
      );

      res.json(rows.map(row => row.hora));
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { doctorId, fecha, hora } = req.body;
      if ([doctorId, fecha, hora].some(isBlank)) {
        return res.status(400).json({ error: 'doctorId, fecha y hora son requeridos' });
      }

      const appointment = await coordinator.schedule({
        patientId: req.user.id,
        doctorId,
        fecha,
        hora
      });

      res.status(201).json({ appointment });
    } catch (error) {
      next(error);
    }
  }
};
