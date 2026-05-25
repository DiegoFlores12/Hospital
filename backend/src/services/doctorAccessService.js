import { staffRepository } from '../repositories/staffRepository.js';
import { userRepository } from '../repositories/userRepository.js';

export async function resolveDoctor(userId) {
  let doctor = await staffRepository.findDoctorByUserId(userId);
  if (doctor) return doctor;

  const user = await userRepository.findById(userId);
  if (!user || user.role !== 'doctor') {
    const error = new Error('La sesión no corresponde a un doctor');
    error.statusCode = 403;
    throw error;
  }

  if (user.email) doctor = await staffRepository.findDoctorByEmail(user.email);

  if (!doctor) {
    const error = new Error('La cuenta de doctor no está vinculada a un trabajador médico. Vincula el usuario doctor con staff.user_id o usa el mismo email en staff.');
    error.statusCode = 403;
    throw error;
  }

  await staffRepository.linkUser(doctor.id, user.id);
  return { ...doctor, user_id: user.id };
}
