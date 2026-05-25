import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import { staffRepository } from '../repositories/staffRepository.js';
import { isBlank } from '../utils/validation.js';

function splitFullName(nombreCompleto) {
  const parts = String(nombreCompleto || '').trim().split(/\s+/);
  const nombre = parts.shift() || '';
  const apellido = parts.join(' ') || null;
  return { nombre, apellido };
}

export const staffService = {
  async saveStaff(data) {
    if (isBlank(data.nombre)) {
      const error = new Error('El nombre del trabajador es obligatorio');
      error.statusCode = 400;
      throw error;
    }

    let userId = data.user_id || null;

    if (!data.id && data.tipo === 'doctor' && !isBlank(data.rut_acceso) && !isBlank(data.password_acceso)) {
      const hash = await bcrypt.hash(data.password_acceso, 10);
      const name = splitFullName(data.nombre);
      const doctorUser = await userRepository.createDoctorAccount({
        nombre: name.nombre,
        apellido: name.apellido,
        rut: data.rut_acceso.trim(),
        telefono: data.telefono || null,
        email: data.email || null,
        password_hash: hash
      });
      userId = doctorUser.id;
    }

    const payload = {
      ...data,
      user_id: userId,
      nombre: data.nombre.trim()
    };

    return data.id ? staffRepository.update(data.id, payload) : staffRepository.create(payload);
  }
};
