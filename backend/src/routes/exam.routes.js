import { Router } from 'express';
import { examController } from '../controllers/exam.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/my', requireAuth('paciente'), examController.myExams);

export default router;
