import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../prismaClient';
import { generateToken } from '../utils/jwt';
import { sendMail } from '../utils/mailer';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, dni, role, careerId } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { dni }] }
    });

    if (existingUser) {
      res.status(400).json({ message: 'El usuario o DNI ya están registrados.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const sessionToken = crypto.randomUUID();
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        dni,
        role: role || 'ALUMNO',
        careerId: careerId || null,
        sessionToken
      }
    });

    const token = generateToken(newUser.id, newUser.role, sessionToken);
    res.status(201).json({ user: { id: newUser.id, email: newUser.email, role: newUser.role, firstName: newUser.firstName }, token });
  } catch (error: any) {
    res.status(500).json({ message: 'Error en el registro', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Credenciales inválidas.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Credenciales inválidas.' });
      return;
    }

    const sessionToken = crypto.randomUUID();
    await prisma.user.update({
      where: { id: user.id },
      data: { sessionToken }
    });

    const token = generateToken(user.id, user.role, sessionToken);
    res.status(200).json({ user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName }, token });
  } catch (error: any) {
    res.status(500).json({ message: 'Error en el login', error: error.message });
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, firstName: true, lastName: true, dni: true, role: true, career: true }
    });
    
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    const message = `
      <h1>Recuperación de Contraseña</h1>
      <p>Hola ${user.firstName},</p>
      <p>Has solicitado restablecer tu contraseña en el Sistema de Eventos ISTPET. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <a href="${resetUrl}" style="display:inline-block; padding:10px 20px; background-color:#1F295B; color:white; text-decoration:none; border-radius:5px;">Restablecer Contraseña</a>
      <p>Este enlace expirará en 1 hora.</p>
    `;

    await sendMail(user.email, 'Recuperación de Contraseña - ISTPET', message);
    res.status(200).json({ message: 'Correo enviado. Revisa tu bandeja de entrada.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al procesar recuperación', error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token as string,
        resetTokenExpiry: { gt: new Date() } // que no haya expirado
      }
    });

    if (!user) {
      res.status(400).json({ message: 'El enlace es inválido o ha expirado.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.status(200).json({ message: 'Contraseña restablecida correctamente.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al restablecer contraseña', error: error.message });
  }
};
