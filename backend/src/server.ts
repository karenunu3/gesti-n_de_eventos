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

app.use(cors());
app.use(express.json());
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

app.listen(port, () => {
  console.log(`Backend de ISTPET corriendo en http://localhost:${port}`);
});
