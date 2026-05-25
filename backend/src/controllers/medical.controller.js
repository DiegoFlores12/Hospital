import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { resolveDoctor } from '../services/doctorAccessService.js';
import { optionalNumber } from '../utils/validation.js';

export const medicalController = {
  async today(req, res, next) {
    try {
      const doctor = await resolveDoctor(req.user.id);
      res.json(await appointmentRepository.listDoctorAppointmentsToday(doctor.id));
    } catch (error) {
      next(error);
    }
  },

  async patients(req, res, next) {
    try {
      const doctor = await resolveDoctor(req.user.id);
      res.json(await appointmentRepository.listDoctorPatients(doctor.id));
    } catch (error) {
      next(error);
    }
  },

  async patientDetail(req, res, next) {
    try {
      const doctor = await resolveDoctor(req.user.id);
      const patient = await appointmentRepository.getDoctorPatient(doctor.id, req.params.patientId);
      if (!patient) return res.status(404).json({ error: 'Paciente no encontrado para este doctor' });

      const appointments = await appointmentRepository.getDoctorPatientHistory(doctor.id, req.params.patientId);
      res.json({ patient, appointments });
    } catch (error) {
      next(error);
    }
  },

  async updatePatient(req, res, next) {
    try {
      const doctor = await resolveDoctor(req.user.id);
      const patient = await appointmentRepository.getDoctorPatient(doctor.id, req.params.patientId);
      if (!patient) return res.status(404).json({ error: 'Paciente no encontrado para este doctor' });

      const updated = await userRepository.updatePatientMedicalData(req.params.patientId, {
        peso_kg: optionalNumber(req.body.peso_kg),
        estatura_cm: optionalNumber(req.body.estatura_cm),
        historial_medico: req.body.historial_medico || null,
        telefono: req.body.telefono || null,
        email: req.body.email || null
      });

      res.json({ patient: updated });
    } catch (error) {
      next(error);
    }
  }
};
