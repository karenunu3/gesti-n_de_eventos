import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prismaClient';
import { validateInstitutionalEmail, sendWelcomeEmail } from '../utils/emails';

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
        modalities: true,
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
    const { email, password, firstName, lastName, dni, role, careerId, modalities } = req.body;

    if (!email || !password || !firstName || !lastName || !dni) {
      res.status(400).json({ message: 'Todos los campos obligatorios deben estar completos.' });
      return;
    }

    // Validar correo institucional
    const emailErr = validateInstitutionalEmail(email);
    if (emailErr) {
      res.status(400).json({ message: emailErr });
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
        careerId: careerId ? parseInt(careerId) : null,
        modalities: Array.isArray(modalities) ? modalities : []
      },
      select: { id: true, email: true, firstName: true, lastName: true, dni: true, role: true, career: true, modalities: true, createdAt: true }
    });

    // Correo de bienvenida (admin creó la cuenta — incluir contraseña temporal)
    sendWelcomeEmail({
      to: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      createdByAdmin: true,
      tempPassword: password,
    }).catch(() => {});

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

    // Verificar que el usuario exista antes de borrar (mejor mensaje de error)
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      res.status(404).json({ message: 'Usuario no encontrado.' });
      return;
    }

    // Eliminar en cascada todas las relaciones del usuario
    // (el schema no tiene onDelete: Cascade configurado en todas las FKs)
    await prisma.$transaction([
      prisma.survey.deleteMany({ where: { userId } }),
      prisma.certificate.deleteMany({ where: { userId } }),
      prisma.eventAttendance.deleteMany({ where: { userId } }),
      prisma.eventRegistration.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Usuario no encontrado.' });
      return;
    }
    console.error('[deleteUser]', error);
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

/** GET /users/me — datos del usuario logueado para "Mi Perfil". */
export const getMyProfile = async (req: any, res: any): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, firstName: true, lastName: true, email: true, dni: true,
        role: true, career: true, modalities: true, semester: true, photoUrl: true,
        createdAt: true,
      }
    });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
};

/** PUT /users/me — actualizar nombre, apellido y foto. Email no editable (importante para login). */
export const updateMyProfile = async (req: any, res: any): Promise<void> => {
  try {
    const { firstName, lastName, photoUrl } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName !== undefined ? { firstName: String(firstName).trim() } : {}),
        ...(lastName !== undefined ? { lastName: String(lastName).trim() } : {}),
        ...(photoUrl !== undefined ? { photoUrl: photoUrl ? String(photoUrl).trim() : null } : {}),
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, dni: true,
        role: true, career: true, modalities: true, semester: true, photoUrl: true,
      }
    });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
  }
};

/** PUT /users/me/password — cambiar contraseña conocida (no es reset por correo). */
export const changeMyPassword = async (req: any, res: any): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Faltan datos: contraseña actual y nueva.' });
      return;
    }
    if (String(newPassword).length < 8) {
      res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al cambiar contraseña', error: error.message });
  }
};

export const updateUserCareer = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const { careerId, modalities, addModality, removeModality } = req.body;
    const userId = parseInt(id);

    // Mode: addModality / removeModality (atomic add/remove for docente multi-modality)
    if (addModality || removeModality) {
      const current = await prisma.user.findUnique({ where: { id: userId }, select: { modalities: true } });
      const set = new Set(current?.modalities || []);
      if (addModality) set.add(addModality);
      if (removeModality) set.delete(removeModality);
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(careerId !== undefined ? { careerId: careerId ? parseInt(careerId) : null } : {}),
          modalities: Array.from(set)
        },
        select: { id: true, email: true, role: true, career: true, modalities: true }
      });
      res.status(200).json(updated);
      return;
    }

    // Mode: full overwrite
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        careerId: careerId ? parseInt(careerId) : null,
        ...(modalities !== undefined ? { modalities: Array.isArray(modalities) ? modalities : [] } : {})
      },
      select: { id: true, email: true, role: true, career: true, modalities: true }
    });

    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al actualizar carrera', error: error.message });
  }
};
