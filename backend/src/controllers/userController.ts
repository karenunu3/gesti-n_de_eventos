import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prismaClient';

export const getUsers = async (req: any, res: any): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dni: true,
        role: true,
        career: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

export const createUser = async (req: any, res: any): Promise<void> => {
  try {
    const { email, password, firstName, lastName, dni, role, careerId } = req.body;

    if (!email || !password || !firstName || !lastName || !dni) {
      res.status(400).json({ message: 'Todos los campos obligatorios deben estar completos.' });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { dni }] }
    });
    if (existing) {
      res.status(400).json({ message: 'Ya existe un usuario con ese correo o DNI.' });
      return;
    }

    const validRoles = ['ADMIN', 'SECRETARIA', 'DOCENTE', 'ALUMNO'];
    const assignedRole = validRoles.includes(role) ? role : 'ALUMNO';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        dni,
        role: assignedRole,
        careerId: careerId ? parseInt(careerId) : null
      },
      select: { id: true, email: true, firstName: true, lastName: true, dni: true, role: true, career: true, createdAt: true }
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

export const deleteUser = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // No permitir eliminar al propio admin que hace la petición
    if (userId === req.user.id) {
      res.status(400).json({ message: 'No puedes eliminar tu propia cuenta.' });
      return;
    }

    await prisma.user.delete({ where: { id: userId } });
    res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

export const updateUserRole = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Validar rol
    const validRoles = ['ADMIN', 'SECRETARIA', 'DOCENTE', 'ALUMNO'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ message: 'Rol inválido' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: { id: true, email: true, role: true }
    });

    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al actualizar rol', error: error.message });
  }
};
