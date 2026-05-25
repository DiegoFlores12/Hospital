import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function requireAuth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) return res.status(401).json({ error: 'Token requerido' });

    try {
      const payload = jwt.verify(token, env.jwtSecret);
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ error: 'Rol no autorizado' });
      }
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
}
