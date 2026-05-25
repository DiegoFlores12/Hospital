import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import examRoutes from './routes/exam.routes.js';
import adminRoutes from './routes/admin.routes.js';
import medicalRoutes from './routes/medical.routes.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'hospital-api' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/exams', examRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/doctor', medicalRoutes);

  app.use(errorHandler);

  return app;
}
