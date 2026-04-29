import { Request, Response } from 'express';
import prisma from '../prismaClient';
import jwt from 'jsonwebtoken';

// Helper para calcular la distancia de Haversine
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radio de la tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distancia en km
  return d * 1000; // Distancia en metros
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

export const markAttendance = async (req: any, res: Response): Promise<void> => {
  try {
    const eventId = parseInt(req.params.eventId);
    const userId = req.user.id;
    const { latitude, longitude, qrToken } = req.body;

    if (!req.file && !qrToken) {
      res.status(400).json({ message: 'Se requiere una foto en tiempo real o un escaneo QR' });
      return;
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/default-qr-attendance.jpg';

    if (!latitude || !longitude) {
      res.status(400).json({ message: 'Se requiere la ubicación (latitud y longitud)' });
      return;
    }

    if (!qrToken) {
      res.status(400).json({ message: 'Se requiere escanear el Código QR proyectado por el Docente' });
      return;
    }

    // Validar el Token QR
    try {
      const decoded: any = jwt.verify(qrToken, process.env.JWT_SECRET || 'secret_fallback');
      if (decoded.eventId !== eventId || decoded.type !== 'attendance_qr') {
        res.status(400).json({ message: 'El código QR no corresponde a este evento' });
        return;
      }
    } catch (err) {
      res.status(400).json({ message: 'El código QR es inválido o ha expirado. Pide al docente que proyecte uno nuevo.' });
      return;
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ message: 'Evento no encontrado' });
      return;
    }

    // Verificar si el usuario está inscrito
    const isRegistered = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } }
    });

    if (!isRegistered) {
      res.status(403).json({ message: 'No estás inscrito en este evento' });
      return;
    }

    // Verificar si ya registró asistencia
    const existingAttendance = await prisma.eventAttendance.findUnique({
      where: { eventId_userId: { eventId, userId } }
    });

    // Lógica Antifraude: Distancia
    let isLocationValid = true;
    if (event.latitude && event.longitude && event.radiusMeters) {
      const distance = getDistanceFromLatLonInKm(event.latitude, event.longitude, parseFloat(latitude), parseFloat(longitude));
      if (distance > event.radiusMeters) {
        isLocationValid = false; // Registrado fuera del radio
      }
    }

    if (existingAttendance) {
      // CHECK-OUT
      if (existingAttendance.checkOutAt) {
        res.status(400).json({ message: 'Ya registraste tu salida para este evento' });
        return;
      }
      
      const updatedAttendance = await prisma.eventAttendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkOutAt: new Date(),
          checkOutLatitude: parseFloat(latitude),
          checkOutLongitude: parseFloat(longitude),
          isCheckOutValid: isLocationValid
        }
      });
      res.status(200).json({ message: 'Salida registrada con éxito', attendance: updatedAttendance, isValid: isLocationValid });
      return;
    }

    // CHECK-IN
    const attendance = await prisma.eventAttendance.create({
      data: {
        eventId,
        userId,
        photoUrl,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        isValid: isLocationValid
      }
    });

    res.status(201).json({ message: 'Entrada registrada con éxito', attendance, isValid: isLocationValid });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al registrar asistencia', error: error.message });
  }
};

export const getEventAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = parseInt(req.params.eventId as string);
    const attendances = await prisma.eventAttendance.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, dni: true, career: true } }
      },
      orderBy: { recordedAt: 'desc' }
    });
    res.status(200).json(attendances);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener asistencias', error: error.message });
  }
};

export const validateAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const attendanceId = parseInt(req.params.id as string);
    const { isValid } = req.body;

    const existing = await prisma.eventAttendance.findUnique({ where: { id: attendanceId } });

    const attendance = await prisma.eventAttendance.update({
      where: { id: attendanceId },
      data: { 
        isValid,
        isCheckOutValid: isValid,
        ...(isValid && !existing?.checkOutAt ? { checkOutAt: new Date() } : {})
      }
    });

    res.status(200).json({ message: 'Estado de asistencia actualizado', attendance });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al actualizar asistencia', error: error.message });
  }
};
