import { Request, Response } from 'express';
import prisma from '../prismaClient';
import fs from 'fs';
import path from 'path';
import { generateProfessionalCertificate } from '../utils/certificateGenerator';

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

    // Crear directorio si no existe
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generar PDF profesional
    const pdfPath = `/uploads/certificate_${certificate.certificateCode}.pdf`;
    const fullPath = path.join(__dirname, `../../${pdfPath}`);
    const stream = fs.createWriteStream(fullPath);

    await generateProfessionalCertificate(stream, {
      studentName: `${attendance.user.firstName} ${attendance.user.lastName}`,
      careerName: attendance.user.career?.name || 'No especificada',
      eventTitle: attendance.event.title,
      eventDate: attendance.event.startDate,
      hours: attendance.event.hours,
      certificateCode: certificate.certificateCode,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    });

    // Actualizar base de datos cuando se complete la escritura
    stream.on('finish', async () => {
      try {
        await prisma.certificate.update({
          where: { id: certificate!.id },
          data: { pdfUrl: pdfPath }
        });
        res.status(200).json({
          message: 'Certificado generado con éxito',
          certificateCode: certificate!.certificateCode,
          pdfUrl: pdfPath
        });
      } catch (updateError: any) {
        res.status(500).json({ message: 'Error al guardar certificado', error: updateError.message });
      }
    });

    stream.on('error', (err: any) => {
      res.status(500).json({ message: 'Error al escribir certificado', error: err.message });
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
