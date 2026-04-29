import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { generateToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';

export const createEvent = async (req: any, res: Response): Promise<void> => {
  try {
    const { title, description, startDate, endDate, capacity, hours, latitude, longitude, radiusMeters, isTransversal, careers } = req.body;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        capacity,
        hours,
        latitude,
        longitude,
        radiusMeters,
        isTransversal,
        careers: careers && careers.length > 0 ? {
          connect: careers.map((id: number) => ({ id }))
        } : undefined
      }
    });

    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear el evento', error: error.message });
  }
};

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate, capacity, hours, latitude, longitude, radiusMeters, isTransversal, careers } = req.body;
    
    const event = await prisma.event.update({
      where: { id: parseInt(id as string) },
      data: {
        title, description, capacity, hours, latitude, longitude, radiusMeters, isTransversal,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        careers: careers && careers.length > 0 ? {
          set: careers.map((cId: number) => ({ id: cId }))
        } : { set: [] }
      }
    });

    res.status(200).json(event);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al actualizar evento', error: error.message });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.event.delete({ where: { id: parseInt(id as string) } });
    res.status(200).json({ message: 'Evento eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al eliminar el evento', error: error.message });
  }
};

export const generateQrToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({ where: { id: parseInt(id as string) } });
    if (!event) {
      res.status(404).json({ message: 'Evento no encontrado' });
      return;
    }

    // Token válido por 30 segundos
    const qrToken = jwt.sign(
      { eventId: event.id, type: 'attendance_qr' },
      process.env.JWT_SECRET || 'secret_fallback',
      { expiresIn: '30s' }
    );

    res.status(200).json({ qrToken });
  } catch (error: any) {
    res.status(500).json({ message: 'Error generando token QR', error: error.message });
  }
};

export const getEvents = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const events = await prisma.event.findMany({
      include: {
        careers: true,
        _count: {
          select: { registrations: true, attendances: true }
        },
        registrations: {
          where: { userId }
        },
        attendances: {
          where: { userId }
        }
      },
      orderBy: { startDate: 'asc' }
    });
    res.status(200).json(events);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener eventos', error: error.message });
  }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = parseInt(req.params.id as string);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        careers: true,
        registrations: {
          include: { user: { select: { id: true, firstName: true, lastName: true, dni: true } } }
        }
      }
    });

    if (!event) {
      res.status(404).json({ message: 'Evento no encontrado' });
      return;
    }

    res.status(200).json(event);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener evento', error: error.message });
  }
};

export const registerToEvent = async (req: any, res: Response): Promise<void> => {
  try {
    const eventId = parseInt(req.params.id as string);
    const userId = req.user.id;

    // Verificar si el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } }, careers: true }
    });

    if (!event) {
      res.status(404).json({ message: 'Evento no encontrado' });
      return;
    }

    // Verificar cupo
    if (event.capacity && event._count.registrations >= event.capacity) {
      res.status(400).json({ message: 'El evento no tiene cupos disponibles' });
      return;
    }

    // Registrar inscripción
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId
      }
    });

    res.status(201).json({ message: 'Inscripción exitosa', registration });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'Ya estás inscrito a este evento' });
    } else {
      res.status(500).json({ message: 'Error al inscribirse al evento', error: error.message });
    }
  }
};
