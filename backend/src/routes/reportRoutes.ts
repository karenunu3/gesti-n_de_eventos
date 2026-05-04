import { Router } from 'express';
import { getStudentReport, generateCertificate, verifyCertificate, exportExcel, submitSurvey, getSurveyResults } from '../controllers/reportController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

// /api/reports

// Obtener reporte de un alumno (el admin puede pasar userId, el alumno se usa a sí mismo)
router.get('/student', protect, getStudentReport);
router.get('/student/:userId', protect, getStudentReport);

// Generar o recuperar certificado
router.post('/certificate/:eventId', protect, generateCertificate);
router.post('/certificate/:eventId/:userId', protect, generateCertificate);

// Exportar a Excel (Admin/Secretaría/Docente)
router.get('/excel/:eventId', protect, restrictTo('ADMIN', 'SECRETARIA', 'DOCENTE'), exportExcel);

// Resultados de encuestas por evento (Admin/Secretaría/Docente)
router.get('/surveys/:eventId', protect, restrictTo('ADMIN', 'SECRETARIA', 'DOCENTE'), getSurveyResults);

// Verificación pública (no necesita token)
router.get('/verify/:code', verifyCertificate);

// Encuesta de satisfacción
router.post('/survey', protect, submitSurvey);

export default router;
