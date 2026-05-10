import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import reportRoutes from './routes/reportRoutes';
import careerRoutes from './routes/careerRoutes';
import userRoutes from './routes/userRoutes';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Crear carpeta uploads si no existe
if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
  fs.mkdirSync(path.join(__dirname, '../uploads'));
}

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '2mb' })); // 2MB para soportar fotos de perfil en base64
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/users', userRoutes);

// Error handler global — siempre responde JSON (en lugar de HTML default de Vercel)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err);
  if (res.headersSent) return;
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  });
});

// 404 handler para rutas API que no existen — JSON en lugar de HTML
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Endpoint no encontrado' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend de ISTPET corriendo en http://localhost:${port}`);
  });
}

export default app;
