import { Router } from 'express';
import { getCareers, createCareer, deleteCareer } from '../controllers/careerController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

// Pública (o protegida para todos los registrados)
router.get('/', getCareers);

// Solo Admin o Secretaría
router.post('/', protect, restrictTo('ADMIN', 'SECRETARIA'), createCareer);
router.delete('/:id', protect, restrictTo('ADMIN', 'SECRETARIA'), deleteCareer);

export default router;
