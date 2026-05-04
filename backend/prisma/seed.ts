import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ISTPET_LAT = -0.2824216;
const ISTPET_LNG = -78.5555266;

const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
};

const addDaysEnd = (base: Date, days: number, endHour = 17) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(endHour, 0, 0, 0);
  return d;
};

async function main() {
  const now = new Date();

  // Upsert careers
  const [soft, conta, admin, elec, redes] = await Promise.all([
    prisma.career.upsert({ where: { name: 'Desarrollo de Software' }, update: {}, create: { name: 'Desarrollo de Software' } }),
    prisma.career.upsert({ where: { name: 'Contabilidad' }, update: {}, create: { name: 'Contabilidad' } }),
    prisma.career.upsert({ where: { name: 'Administración de Empresas' }, update: {}, create: { name: 'Administración de Empresas' } }),
    prisma.career.upsert({ where: { name: 'Electrónica' }, update: {}, create: { name: 'Electrónica' } }),
    prisma.career.upsert({ where: { name: 'Redes y Telecomunicaciones' }, update: {}, create: { name: 'Redes y Telecomunicaciones' } }),
  ]);

  const events = [
    {
      title: 'Charla: Oportunidades Laborales en el Sector Tecnológico',
      description: 'Empresas líderes del Ecuador presentan oportunidades de pasantías y empleo para egresados y estudiantes de últimos semestres. Networking al finalizar.',
      startDate: addDays(now, 3),
      endDate: addDaysEnd(now, 3, 13),
      hours: 4,
      capacity: 80,
      isTransversal: true,
      careers: [],
    },
    {
      title: 'Seminario de Emprendimiento e Innovación',
      description: 'Desarrolla tu proyecto de negocios con mentores del sector empresarial ecuatoriano. Incluye talleres prácticos, casos de éxito y sesión de networking.',
      startDate: addDays(now, 7),
      endDate: addDaysEnd(now, 7, 18),
      hours: 8,
      capacity: 60,
      isTransversal: true,
      careers: [],
    },
    {
      title: 'Taller de Programación con Python para Datos',
      description: 'Introducción práctica a Python orientado a análisis de datos, automatización y machine learning básico. Requiere laptop.',
      startDate: addDays(now, 10),
      endDate: addDaysEnd(now, 10, 16),
      hours: 6,
      capacity: 30,
      isTransversal: false,
      careers: [soft, redes],
    },
    {
      title: 'Conferencia: Ética y Responsabilidad Profesional',
      description: 'Jornada académica sobre valores institucionales, ética en el ejercicio profesional y responsabilidad social en el Ecuador contemporáneo.',
      startDate: addDays(now, 14),
      endDate: addDaysEnd(now, 14, 14),
      hours: 4,
      capacity: 120,
      isTransversal: true,
      careers: [],
    },
    {
      title: 'Workshop: Finanzas Personales e Inversión',
      description: 'Taller práctico sobre presupuesto, ahorro, crédito e inversiones para jóvenes profesionales. Con casos reales del mercado ecuatoriano.',
      startDate: addDays(now, 17),
      endDate: addDaysEnd(now, 17, 15),
      hours: 5,
      capacity: 40,
      isTransversal: false,
      careers: [conta, admin],
    },
    {
      title: 'Feria de Ciencias e Innovación Tecnológica 2025',
      description: 'Exposición de proyectos de titulación e innovación de los estudiantes del ISTPET. Participa como expositor o visitante.',
      startDate: addDays(now, 22),
      endDate: addDaysEnd(now, 23, 18),
      hours: 16,
      capacity: null,
      isTransversal: true,
      careers: [],
    },
    {
      title: 'Capacitación en Mantenimiento de Redes Industriales',
      description: 'Actualización técnica sobre protocolos industriales, PLC y automatización de procesos orientada a perfiles de Electrónica y Redes.',
      startDate: addDays(now, 28),
      endDate: addDaysEnd(now, 28, 17),
      hours: 8,
      capacity: 25,
      isTransversal: false,
      careers: [elec, redes],
    },
    {
      title: 'Jornada de Bienvenida e Integración Institucional',
      description: 'Evento de integración para estudiantes nuevos y reingresos. Presentación de servicios, reglamentos y actividades extracurriculares del ISTPET.',
      startDate: addDays(now, 35),
      endDate: addDaysEnd(now, 35, 13),
      hours: 3,
      capacity: 200,
      isTransversal: true,
      careers: [],
    },
  ];

  for (const { careers, ...data } of events) {
    await prisma.event.create({
      data: {
        ...data,
        latitude: ISTPET_LAT,
        longitude: ISTPET_LNG,
        radiusMeters: 200,
        careers: careers.length > 0 ? { connect: careers.map(c => ({ id: c.id })) } : undefined,
      },
    });
  }

  console.log(`✅ Seed completado: ${events.length} eventos próximos creados`);
  console.log('   Carreras disponibles: Desarrollo de Software, Contabilidad, Administración, Electrónica, Redes');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
