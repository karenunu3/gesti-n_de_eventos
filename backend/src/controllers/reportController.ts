import { Request, Response } from 'express';
import prisma from '../prismaClient';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

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
      include: { event: true, user: true }
    });

    if (!attendance || !attendance.isValid) {
      res.status(400).json({ message: 'El usuario no tiene asistencia validada para este evento.' });
      return;
    }

    // Verificar Check-Out (Nuevo requerimiento Fase 5)
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

    // Verificar si ya existe el certificado
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

    // Generar PDF y QR
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
    const pdfPath = `/uploads/certificate_${certificate.certificateCode}.pdf`;
    const fullPath = path.join(__dirname, `../../${pdfPath}`);
    
    const stream = fs.createWriteStream(fullPath);
    doc.pipe(stream);

    // Diseño básico del certificado
    doc.fontSize(30).text('CERTIFICADO DE ASISTENCIA', { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).text('Instituto Superior Tecnológico "Mayor Pedro Traversari"', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(16).text('Otorga el presente certificado a:', { align: 'center' });
    doc.moveDown();
    doc.fontSize(24).text(`${attendance.user.firstName} ${attendance.user.lastName}`, { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(16).text(`Por haber participado en el evento "${attendance.event.title}"`, { align: 'center' });
    doc.text(`con una duración de ${attendance.event.hours} horas.`, { align: 'center' });

    // Generar código QR para verificación estática
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${certificate.certificateCode}`;
    const qrImage = await QRCode.toDataURL(verificationUrl);
    
    doc.image(qrImage, 50, 450, { fit: [100, 100] });
    doc.fontSize(10).text(`Código de verificación: ${certificate.certificateCode}`, 50, 560);
    
    doc.end();

    stream.on('finish', async () => {
      await prisma.certificate.update({
        where: { id: certificate!.id },
        data: { pdfUrl: pdfPath }
      });
      res.status(200).json({ message: 'Certificado generado con éxito', certificateCode: certificate!.certificateCode, pdfUrl: pdfPath });
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
