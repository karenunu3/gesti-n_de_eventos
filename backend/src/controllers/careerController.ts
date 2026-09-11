import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getCareers = async (req: Request, res: Response): Promise<void> => {
  try {
    const careers = await prisma.career.findMany({
      include: {
        _count: {
          select: { users: true, events: true }
        }
      }
    });
    res.status(200).json(careers);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener carreras', error: error.message });
  }
};

export const createCareer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ message: 'El nombre es obligatorio' });
      return;
    }
    const career = await prisma.career.create({ data: { name } });
    res.status(201).json(career);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'Esta carrera ya existe' });
    } else {
      res.status(500).json({ message: 'Error al crear carrera', error: error.message });
    }
  }
};

export const deleteCareer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID de carrera inválido' });
      return;
    }

    const existing = await prisma.career.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Carrera no encontrada' });
      return;
    }

    // Desvincular usuarios asignados a esta carrera antes de eliminarla
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { careerId: id },
        data: { careerId: null }
      }),
      prisma.career.delete({ where: { id } })
    ]);

    res.status(200).json({ message: 'Carrera eliminada con éxito' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al eliminar carrera', error: error.message });
  }
};
