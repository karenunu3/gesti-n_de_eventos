import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token = req.headers.authorization;
  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }
  
  if (!token) {
    res.status(401).json({ message: 'No estás autenticado.' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
      return;
    }
    next();
  };
};
