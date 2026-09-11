import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../prismaClient';
import { generateToken } from '../utils/jwt';
import { sendMail } from '../utils/mailer';
import { validateInstitutionalEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../utils/emails';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, dni, role, careerId, semester, modalities } = req.body;

    // Validar correo institucional
    const emailErr = validateInstitutionalEmail(email);
    if (emailErr) {
      res.status(400).json({ message: emailErr });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { dni }] }
    });

    if (existingUser) {
      res.status(400).json({ message: 'El usuario o CI ya están registrados.' });
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
        role: 'ALUMNO', // Forzado para evitar escalada de privilegios en registro público
        careerId: careerId || null,
        modalities: Array.isArray(modalities) ? modalities : [],
        semester: semester || null,
        isApproved: false, // Requiere aprobación del Administrador
        sessionToken
      }
    });

    // Correo de bienvenida inmediato
    sendWelcomeEmail({
      to: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      createdByAdmin: false,
    }).catch(() => {});

    res.status(201).json({
      message: 'Registro exitoso. Tu cuenta ha sido creada y está pendiente de aprobación por el Administrador.',
      pendingApproval: true
    });
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

    // Verificar aprobación por Administrador
    if (user.isApproved === false) {
      res.status(403).json({ message: 'Tu cuenta está pendiente de aprobación por el Administrador. Comunícate con la institución para su activación.' });
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
      select: { id: true, email: true, firstName: true, lastName: true, dni: true, role: true, career: true, modalities: true }
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
      res.status(404).json({ message: 'El correo ingresado no está registrado en el sistema.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry }
    });

    const originHeader = (req.headers.origin as string) || (req.get('origin') as string) || process.env.FRONTEND_URL || 'https://gestioneventosistpet.com';
    const resetUrl = `${originHeader.replace(/\/$/, '')}/reset-password/${resetToken}`;

    await sendPasswordResetEmail({ to: user.email, firstName: user.firstName, resetUrl });
    res.status(200).json({ message: 'Correo enviado. Revisa tu bandeja de entrada.' });
  } catch (error: any) {
    console.error('❌ forgotPassword error:', error);
    const detail = error.message || 'Error desconocido';
    res.status(500).json({ message: `Error al enviar correo: ${detail}` });
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
