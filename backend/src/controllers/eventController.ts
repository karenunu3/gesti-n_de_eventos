import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { generateToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';

/** Detecta si dos rangos de fechas se traslapan (excluyendo eventId si se pasa, para update). */
const findOverlappingEvent = async (start: Date, end: Date, excludeId?: number) => {
  return prisma.event.findFirst({
    where: {
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
      // Hay traslape si: existingStart < newEnd AND existingEnd > newStart
      AND: [
        { startDate: { lt: end } },
        { endDate: { gt: start } },
      ],
    },
    select: { id: true, title: true, startDate: true, endDate: true },
  });
};

export const createEvent = async (req: any, res: Response): Promise<void> => {
  try {
    const { title, description, startDate, endDate, capacity, hours, latitude, longitude, radiusMeters, isTransversal, careers } = req.body;

    // Validaciones de duración
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const now = new Date();

    // 1. Validar que startDate < endDate
    if (startDateObj >= endDateObj) {
      res.status(400).json({ message: 'La fecha de inicio debe ser anterior a la fecha de fin' });
      return;
    }

    // 2. Validar horas (1-8)
    if (!hours || hours < 1 || hours > 8) {
      res.status(400).json({ message: 'Las horas deben estar entre 1 y 8' });
      return;
    }

    // 3. Validar que no sea en el pasado (con 5 min de gracia para que "ahora" sea válido)
    const grace = new Date(now.getTime() - 5 * 60 * 1000);
    if (startDateObj < grace) {
      res.status(400).json({ message: 'El evento no puede programarse en una fecha pasada' });
      return;
    }

    // 4. Validar capacidad (si se proporciona, debe ser > 0)
    if (capacity !== null && capacity !== undefined && capacity <= 0) {
      res.status(400).json({ message: 'La capacidad debe ser mayor a 0' });
      return;
    }

    // 5. Validar que no se cruce con otro evento en el mismo rango horario
    const overlap = await findOverlappingEvent(startDateObj, endDateObj);
    if (overlap) {
      const fmt = (d: Date) => new Date(d).toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'short', timeStyle: 'short' });
      res.status(409).json({
        message: `Conflicto de horario: ya existe el evento "${overlap.title}" programado de ${fmt(overlap.startDate)} a ${fmt(overlap.endDate)}.`
      });
      return;
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: startDateObj,
        endDate: endDateObj,
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

    // Bloquear edición si el evento ORIGINAL ya finalizó antes del inicio de hoy
    const eventIdNum = parseInt(id as string);
    const existing = await prisma.event.findUnique({ where: { id: eventIdNum }, select: { endDate: true } });
    if (!existing) {
      res.status(404).json({ message: 'Evento no encontrado' });
      return;
    }
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (existing.endDate < startOfToday) {
      res.status(400).json({ message: 'Este evento ya finalizó. Solo se puede editar hasta el día en que se realizó.' });
      return;
    }

    // Validaciones de duración
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // 1. Validar que startDate < endDate
    if (startDateObj >= endDateObj) {
      res.status(400).json({ message: 'La fecha de inicio debe ser anterior a la fecha de fin' });
      return;
    }

    // 2. Validar horas (1-8)
    if (!hours || hours < 1 || hours > 8) {
      res.status(400).json({ message: 'Las horas deben estar entre 1 y 8' });
      return;
    }

    // 3. Validar capacidad (si se proporciona, debe ser > 0)
    if (capacity !== null && capacity !== undefined && capacity <= 0) {
      res.status(400).json({ message: 'La capacidad debe ser mayor a 0' });
      return;
    }

    // 5. Validar que no se cruce con otro evento (excluyendo este mismo)
    const overlap = await findOverlappingEvent(startDateObj, endDateObj, eventIdNum);
    if (overlap) {
      const fmt = (d: Date) => new Date(d).toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'short', timeStyle: 'short' });
      res.status(409).json({
        message: `Conflicto de horario: ya existe el evento "${overlap.title}" programado de ${fmt(overlap.startDate)} a ${fmt(overlap.endDate)}.`
      });
      return;
    }

    const event = await prisma.event.update({
      where: { id: eventIdNum },
      data: {
        title, description, capacity, hours, latitude, longitude, radiusMeters, isTransversal,
        startDate: startDateObj,
        endDate: endDateObj,
        careers: careers && careers.length > 0 ? {
          set: careers.map((cId: number) => ({ id: cId }))
        } : { set: [] }
      },
      include: { careers: true }
    });

    // Auto-purga: si el evento es específico, eliminar inscritos cuya carrera ya no esté permitida
    if (!isTransversal) {
      const allowedCareerIds = event.careers.map(c => c.id);
      const registrations = await prisma.eventRegistration.findMany({
        where: { eventId: eventIdNum },
        include: { user: { select: { id: true, role: true, careerId: true } } }
      });
      const toRemove = registrations
        .filter(r => r.user.role === 'ALUMNO' && (!r.user.careerId || !allowedCareerIds.includes(r.user.careerId)))
        .map(r => r.id);
      if (toRemove.length > 0) {
        await prisma.eventRegistration.deleteMany({ where: { id: { in: toRemove } } });
      }
    }

    res.status(200).json(event);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al actualizar evento', error: error.message });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = parseInt(req.params.id as string);
    if (Number.isNaN(eventId)) {
      res.status(400).json({ message: 'ID de evento inválido' });
      return;
    }

    // Eliminar todos los registros dependientes en una transacción
    // (las relaciones del schema no tienen onDelete: Cascade configurado)
    await prisma.$transaction([
      prisma.survey.deleteMany({ where: { eventId } }),
      prisma.certificate.deleteMany({ where: { eventId } }),
      prisma.eventAttendance.deleteMany({ where: { eventId } }),
      prisma.eventRegistration.deleteMany({ where: { eventId } }),
      prisma.event.delete({ where: { id: eventId } }),
    ]);

    res.status(200).json({ message: 'Evento eliminado correctamente' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Evento no encontrado' });
    } else {
      res.status(500).json({ message: 'Error al eliminar el evento', error: error.message });
    }
  }
};

export const generateQrToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id as string) },
      include: { _count: { select: { attendances: true, registrations: true } } }
    });
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

    res.status(200).json({
      qrToken,
      attendanceCount: event._count.attendances,
      registrationCount: event._count.registrations,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error generando token QR', error: error.message });
  }
};

export const getEvents = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    // Obtener información del usuario (role y carrera)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, careerId: true }
    });

    // Filtrar eventos según el rol del usuario
    const whereClause = (user?.role === 'ALUMNO' && user?.careerId)
      ? {
          OR: [
            { isTransversal: true }, // Los eventos transversales se muestran a todos
            { careers: { some: { id: user.careerId } } } // O eventos de su carrera
          ]
        }
      : {}; // Admins, secretarias y docentes ven todos los eventos

    const events = await prisma.event.findMany({
      where: whereClause,
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

export const removeRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const regId = parseInt(req.params.regId as string);
    if (Number.isNaN(regId)) {
      res.status(400).json({ message: 'ID de inscripción inválido' });
      return;
    }
    await prisma.eventRegistration.delete({ where: { id: regId } });
    res.status(200).json({ message: 'Inscripción eliminada' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Inscripción no encontrada' });
    } else {
      res.status(500).json({ message: 'Error al eliminar inscripción', error: error.message });
    }
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
          include: { user: { select: { id: true, firstName: true, lastName: true, dni: true, email: true, career: true, modalities: true } } },
          orderBy: { registeredAt: 'desc' }
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

export const getCurrentMonthEvents = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    // Obtener el primer y último día del mes actual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Obtener información del usuario (role y carrera)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, careerId: true }
    });

    // Filtrar eventos según el rol del usuario
    const whereClause = {
      startDate: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth
      },
      ...(user?.role === 'ALUMNO' && user?.careerId
        ? {
            OR: [
              { isTransversal: true },
              { careers: { some: { id: user.careerId } } }
            ]
          }
        : {})
    };

    const events = await prisma.event.findMany({
      where: whereClause,
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
    res.status(500).json({ message: 'Error al obtener eventos del mes actual', error: error.message });
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

    // Las inscripciones se cierran cuando el evento INICIA
    // (ya no se permite inscribirse a eventos en curso ni finalizados)
    if (event.startDate <= new Date()) {
      res.status(400).json({ message: 'Las inscripciones están cerradas: el evento ya inició.' });
      return;
    }

    // Verificar cupo
    if (event.capacity && event._count.registrations >= event.capacity) {
      res.status(400).json({ message: 'El evento no tiene cupos disponibles' });
      return;
    }

    // Verificar coherencia de carrera (si el evento es específico)
    if (!event.isTransversal) {
      const userInfo = await prisma.user.findUnique({
        where: { id: userId },
        select: { careerId: true, role: true }
      });
      // Solo aplicamos esta restricción a alumnos
      if (userInfo?.role === 'ALUMNO') {
        const allowedCareerIds = event.careers.map(c => c.id);
        if (!userInfo.careerId || !allowedCareerIds.includes(userInfo.careerId)) {
          res.status(403).json({ message: 'Este evento es específico para otras carreras. No estás autorizado a inscribirte.' });
          return;
        }
      }
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
