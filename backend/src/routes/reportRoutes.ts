import { Router } from 'express';
import { getStudentReport, generateCertificate, verifyCertificate, exportExcel, submitSurvey } from '../controllers/reportController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

// /api/reports

// Obtener reporte de un alumno (el admin puede pasar userId, el alumno se usa a sí mismo)
router.get('/student', protect, getStudentReport);
router.get('/student/:userId', protect, getStudentReport);

// Generar o recuperar certificado
router.post('/certificate/:eventId', protect, generateCertificate);
router.post('/certificate/:eventId/:userId', protect, generateCertificate);

// Exportar a Excel (Admin/Secretaría)
router.get('/excel/:eventId', protect, restrictTo('ADMIN', 'SECRETARIA'), exportExcel);

// Verificación pública (no necesita token)
router.get('/verify/:code', verifyCertificate);

// Encuesta de satisfacción
router.post('/survey', protect, submitSurvey);

export default router;
