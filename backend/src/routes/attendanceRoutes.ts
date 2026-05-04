import { Router } from 'express';
import { markAttendance, getEventAttendance, validateAttendance } from '../controllers/attendanceController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

// /api/attendance/:eventId
router.post('/:eventId', protect, restrictTo('ALUMNO', 'DOCENTE'), upload.single('photo'), markAttendance);

// Rutas de administración — DOCENTE también puede ver y validar
router.get('/event/:eventId', protect, restrictTo('ADMIN', 'SECRETARIA', 'DOCENTE'), getEventAttendance);
router.put('/:id/validate', protect, restrictTo('ADMIN', 'SECRETARIA', 'DOCENTE'), validateAttendance);

export default router;
