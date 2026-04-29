import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'supersecretistpet2026';

export const generateToken = (userId: number, role: string) => {
  return jwt.sign({ id: userId, role }, SECRET, { expiresIn: '8h' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET) as { id: number; role: string; iat: number; exp: number };
};
