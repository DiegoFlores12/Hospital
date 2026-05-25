import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import { buildDate, isBlank, nullIfBlank, optionalNumber } from '../utils/validation.js';
import { publicUser } from '../utils/users.js';
import { createToken } from '../utils/token.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { nombre, apellido, rut, telefono, email, password } = req.body;
      const fecha_nacimiento = req.body.fecha_nacimiento || buildDate(req.body);
      if ([nombre, apellido, rut, password].some(isBlank)) {
        return res.status(400).json({ error: 'Nombre, apellido, RUT y contraseña son obligatorios' });
      }

      const hash = await bcrypt.hash(password, 10);
      const user = await userRepository.createPatient({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        rut: rut.trim(),
        telefono: nullIfBlank(telefono),
        email: nullIfBlank(email),
        fecha_nacimiento: fecha_nacimiento || null,
        peso_kg: optionalNumber(req.body.peso_kg),
        estatura_cm: optionalNumber(req.body.estatura_cm),
        password_hash: hash
      });

      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { rut, password, role } = req.body;
      if ([rut, password, role].some(isBlank)) {
        return res.status(400).json({ error: 'RUT/correo, contraseña y rol son obligatorios' });
      }

      const user = await userRepository.findForLogin(rut.trim(), role);
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

      const safeUser = publicUser(user);
      res.json({ token: createToken(safeUser), user: safeUser });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const user = await userRepository.findPublicById(req.user.id);
      if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }
};
