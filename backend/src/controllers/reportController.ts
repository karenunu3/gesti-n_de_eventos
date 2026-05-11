import { Request, Response } from 'express';
import prisma from '../prismaClient';
import fs from 'fs';
import path from 'path';
import { generateProfessionalCertificate } from '../utils/certificateGenerator';
import { put } from '@vercel/blob';

export const getStudentReport = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId || req.user.id);
    
    // Obtenemos todas las asistencias validadas
    const attendances = await prisma.eventAttendance.findMany({
      where: { userId, isValid: true },
      include: { event: true }
    });

    const totalHours = attendances.reduce((sum, att) => sum + att.event.hours, 0);

    res.status(200).json({ attendances, totalHours });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al generar reporte', error: error.message });
  }
};

/**
 * Dashboard enriquecido para el alumno: incluye eventos próximos donde está inscrito,
 * eventos sugeridos (según carrera + general), estadísticas, certificados disponibles,
 * logros y eventos del mes para mini-calendario.
 */
export const getStudentDashboard = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1) Datos del usuario (carrera para sugeridos)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { careerId: true }
    });

    // 2) Asistencias válidas — total horas + lista
    const attendances = await prisma.eventAttendance.findMany({
      where: { userId, isValid: true },
      include: { event: true },
      orderBy: { recordedAt: 'desc' }
    });
    const totalHours = attendances.reduce((sum, att) => sum + att.event.hours, 0);

    // 3) Eventos próximos donde el alumno está inscrito (no han terminado)
    const upcomingRegistered = await prisma.event.findMany({
      where: {
        endDate: { gte: now },
        registrations: { some: { userId } }
      },
      include: {
        careers: true,
        _count: { select: { registrations: true, attendances: true } },
        attendances: { where: { userId } }
      },
      orderBy: { startDate: 'asc' }
    });

    // 4) Eventos sugeridos: no inscrito + (general OR su carrera) + futuro + cupo disponible
    const careerFilter = user?.careerId
      ? { OR: [{ isTransversal: true }, { careers: { some: { id: user.careerId } } }] }
      : { isTransversal: true };
    const suggestedRaw = await prisma.event.findMany({
      where: {
        startDate: { gte: now },
        registrations: { none: { userId } },
        ...careerFilter
      },
      include: {
        careers: true,
        _count: { select: { registrations: true } }
      },
      orderBy: { startDate: 'asc' },
      take: 10
    });
    // Filtrar los que aún tengan cupo
    const suggested = suggestedRaw.filter(e =>
      !e.capacity || e._count.registrations < e.capacity
    ).slice(0, 6);

    // 5) Certificados ya emitidos del usuario
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      select: { eventId: true }
    });
    const certifiedEventIds = new Set(certificates.map(c => c.eventId));

    // 6) Asistencias completas (check-in + check-out válidos) sin certificado aún
    const pendingCertificates = attendances.filter(att =>
      att.isValid && att.checkOutAt && att.isCheckOutValid && !certifiedEventIds.has(att.eventId)
    );

    // 7) Eventos del mes (para mini-calendario)
    const monthEvents = await prisma.event.findMany({
      where: {
        startDate: { gte: monthStart, lte: monthEnd },
        ...careerFilter
      },
      select: { id: true, title: true, startDate: true, endDate: true, isTransversal: true }
    });

    // 8) Logros (badges) calculados según el progreso
    const totalAttendances = attendances.length;
    const badges = [
      { id: 'first', label: 'Primer paso', icon: '🌱', desc: 'Asiste a tu primer evento', target: 1, current: Math.min(totalAttendances, 1), unlocked: totalAttendances >= 1 },
      { id: 'active', label: 'Asistente activo', icon: '🥉', desc: '5 eventos asistidos', target: 5, current: Math.min(totalAttendances, 5), unlocked: totalAttendances >= 5 },
      { id: 'committed', label: 'Comprometido', icon: '🥈', desc: '10 eventos asistidos', target: 10, current: Math.min(totalAttendances, 10), unlocked: totalAttendances >= 10 },
      { id: 'top', label: 'Top estudiante', icon: '🥇', desc: '20 eventos asistidos', target: 20, current: Math.min(totalAttendances, 20), unlocked: totalAttendances >= 20 },
      { id: 'hours50', label: 'Medio centenar', icon: '⭐', desc: '50 horas acumuladas', target: 50, current: Math.min(totalHours, 50), unlocked: totalHours >= 50 },
      { id: 'hours100', label: 'Centenar', icon: '🏆', desc: '100 horas acumuladas', target: 100, current: Math.min(totalHours, 100), unlocked: totalHours >= 100 },
    ];

    res.status(200).json({
      totalHours,
      attendances,
      upcomingRegistered,
      suggested,
      pendingCertificates,
      monthEvents,
      badges,
      // Meta para progreso anual (target configurable; 100h es típico)
      progressTarget: 100,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al cargar dashboard', error: error.message });
  }
};

export const generateCertificate = async (req: any, res: Response): Promise<void> => {
  try {
    const eventId = parseInt(req.params.eventId as string);
    const userId = parseInt((req.params.userId as string) || req.user.id);

    // Verificar si el usuario asistió al evento
    const attendance = await prisma.eventAttendance.findUnique({
      where: { eventId_userId: { eventId, userId } },
      include: {
        event: true,
        user: {
          include: {
            career: { select: { name: true } }
          }
        }
      }
    });

    if (!attendance || !attendance.isValid) {
      res.status(400).json({ message: 'El usuario no tiene asistencia validada para este evento.' });
      return;
    }

    // Verificar Check-Out
    if (!attendance.checkOutAt || !attendance.isCheckOutValid) {
      res.status(400).json({ message: 'Aún no has registrado tu salida o es inválida.' });
      return;
    }

    // Verificar si llenó la encuesta
    const survey = await prisma.survey.findUnique({
      where: { eventId_userId: { eventId, userId } }
    });

    if (!survey) {
      res.status(400).json({ message: 'SURVEY_REQUIRED', detail: 'Debes completar la encuesta de satisfacción para obtener tu certificado.' });
      return;
    }

    // Verificar o crear certificado
    let certificate = await prisma.certificate.findUnique({
      where: { eventId_userId: { eventId, userId } }
    });

    if (!certificate) {
      certificate = await prisma.certificate.create({
        data: {
          eventId,
          userId,
          hoursGranted: attendance.event.hours
        }
      });
    }

    // Generar PDF profesional en Buffer
    const pdfBuffer = await generateProfessionalCertificate({
      studentName: `${attendance.user.firstName} ${attendance.user.lastName}`,
      careerName: attendance.user.career?.name || 'No especificada',
      eventTitle: attendance.event.title,
      eventDate: attendance.event.startDate,
      hours: attendance.event.hours,
      certificateCode: certificate.certificateCode,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    });

    // Subir a Vercel Blob
    const fileName = `certificate_${certificate.certificateCode}.pdf`;
    let pdfUrl = '';

    try {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
         const blobResult = await put(`certificados/${fileName}`, pdfBuffer, {
           access: 'public',
           contentType: 'application/pdf',
           addRandomSuffix: false, // Para mantener el nombre exacto
           allowOverwrite: true // Permite sobrescribir el archivo si el alumno lo vuelve a generar
         });
         pdfUrl = blobResult.url;
      } else {
         // Fallback local temporal si no hay Blob Token configurado en desarrollo
         const uploadsDir = path.join(__dirname, '../../uploads');
         if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
         const localPath = path.join(uploadsDir, fileName);
         fs.writeFileSync(localPath, pdfBuffer);
         pdfUrl = `/uploads/${fileName}`;
      }
    } catch (blobError: any) {
      console.error('Error subiendo a Vercel Blob:', blobError);
      res.status(500).json({ message: `Error Vercel Blob: ${blobError.message}` });
      return;
    }

    // Actualizar base de datos
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { pdfUrl }
    });

    res.status(200).json({
      message: 'Certificado generado con éxito',
      certificateCode: certificate.certificateCode,
      pdfUrl
    });

  } catch (error: any) {
    res.status(500).json({ message: 'Error al generar certificado', error: error.message });
  }
};

export const verifyCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const certificateCode = req.params.code as string;
    const certificate = await prisma.certificate.findUnique({
      where: { certificateCode },
      include: { event: true, user: { select: { firstName: true, lastName: true, dni: true } } }
    });

    if (!certificate) {
      res.status(404).json({ message: 'Certificado no válido o no encontrado' });
      return;
    }

    res.status(200).json({ valid: true, certificate });
  } catch (error: any) {
    res.status(500).json({ message: 'Error de validación', error: error.message });
  }
};

import ExcelJS from 'exceljs';

export const exportExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = parseInt(req.params.eventId as string);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ message: 'Evento no encontrado' });
      return;
    }

    const attendances = await prisma.eventAttendance.findMany({
      where: { eventId },
      include: {
        user: { select: { firstName: true, lastName: true, dni: true, email: true, career: { select: { name: true } } } }
      },
      orderBy: { recordedAt: 'desc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistencia');

    worksheet.columns = [
      { header: 'DNI', key: 'dni', width: 15 },
      { header: 'Nombres', key: 'firstName', width: 20 },
      { header: 'Apellidos', key: 'lastName', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Carrera', key: 'career', width: 25 },
      { header: 'Fecha Registro', key: 'recordedAt', width: 20 },
      { header: 'Estado', key: 'isValid', width: 15 }
    ];

    attendances.forEach(att => {
      worksheet.addRow({
        dni: att.user.dni,
        firstName: att.user.firstName,
        lastName: att.user.lastName,
        email: att.user.email,
        career: att.user.career?.name || 'N/A',
        recordedAt: new Date(att.recordedAt).toLocaleString(),
        isValid: att.isValid ? 'VÁLIDO' : 'INVÁLIDO (Revisar)'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=asistencia_evento_${eventId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ message: 'Error al exportar Excel', error: error.message });
  }
};

export const getSurveyResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = parseInt(req.params.eventId as string);
    const surveys = await prisma.survey.findMany({
      where: { eventId },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const avgRating = surveys.length > 0
      ? Math.round((surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length) * 10) / 10
      : 0;
    res.status(200).json({ surveys, avgRating, total: surveys.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener encuestas', error: error.message });
  }
};

export const submitSurvey = async (req: any, res: Response): Promise<void> => {
  try {
    const { eventId, rating, feedback } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'La calificación debe ser entre 1 y 5 estrellas' });
      return;
    }

    const survey = await prisma.survey.upsert({
      where: { eventId_userId: { eventId: parseInt(eventId), userId } },
      update: { rating, feedback },
      create: { eventId: parseInt(eventId), userId, rating, feedback }
    });

    res.status(201).json({ message: 'Encuesta enviada con éxito', survey });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al enviar encuesta', error: error.message });
  }
};
