import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller.js';

const router = Router();

router.get('/', doctorController.list);

export default router;
