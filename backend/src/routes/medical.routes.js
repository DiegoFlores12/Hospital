import { Router } from 'express';
import { medicalController } from '../controllers/medical.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth('doctor'));
router.get('/appointments/today', medicalController.today);
router.get('/patients', medicalController.patients);
router.get('/patients/:patientId', medicalController.patientDetail);
router.put('/patients/:patientId', medicalController.updatePatient);

export default router;
