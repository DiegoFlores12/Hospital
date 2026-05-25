import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/my', requireAuth('paciente'), appointmentController.myAppointments);
router.get('/availability', appointmentController.availability);
router.post('/', requireAuth('paciente'), appointmentController.create);

export default router;
