import { Router } from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent, generateQrToken, registerToEvent, getCurrentMonthEvents } from '../controllers/eventController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

// Eventos pueden ser vistos por todos los autenticados
router.get('/', protect, getEvents);

// Obtener eventos del mes actual (Dashboard)
router.get('/current-month', protect, getCurrentMonthEvents);

// Crear, actualizar y eliminar solo ADMIN y SECRETARIA
router.post('/', protect, restrictTo('ADMIN', 'SECRETARIA'), createEvent);
router.put('/:id', protect, restrictTo('ADMIN', 'SECRETARIA'), updateEvent);
router.delete('/:id', protect, restrictTo('ADMIN', 'SECRETARIA'), deleteEvent);

// Inscripción al evento (Alumnos y Docentes)
router.post('/:id/register', protect, restrictTo('ALUMNO', 'DOCENTE'), registerToEvent);

// QR Token para asistencia (Docentes y Admin)
router.get('/:id/qr-token', protect, restrictTo('ADMIN', 'SECRETARIA', 'DOCENTE'), generateQrToken);

export default router;
