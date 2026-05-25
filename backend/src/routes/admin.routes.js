import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth('admin'));
router.get('/staff', adminController.staffList);
router.post('/staff', adminController.saveStaff);
router.post('/schedules', adminController.saveSchedule);
router.post('/hiring', adminController.hiring);
router.get('/summary', adminController.summary);

export default router;
