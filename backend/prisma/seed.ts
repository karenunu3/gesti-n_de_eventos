import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ISTPET_LAT = -0.2824216;
const ISTPET_LNG = -78.5555266;

const addDays = (base: Date, days: number, hour = 9) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function main() {
  const now = new Date();
  const defaultPassword = await bcrypt.hash('password123', 10);

  console.log('🧹 Limpiando datos antiguos...');
  await prisma.survey.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.eventAttendance.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log('📚 Creando carreras...');
  const careersData = ['Desarrollo de Software', 'Contabilidad', 'Administración de Empresas', 'Electrónica', 'Redes y Telecomunicaciones'];
  const careers = await Promise.all(
    careersData.map(name => prisma.career.upsert({
      where: { name }, update: {}, create: { name }
    }))
  );

  console.log('👥 Creando usuarios (Personal)...');
  const admin = await prisma.user.create({
    data: { email: 'admin@istpet.edu.ec', password: defaultPassword, firstName: 'Admin', lastName: 'Sistema', dni: '0000000001', role: 'ADMIN' }
  });

  const sec = await prisma.user.create({
    data: { email: 'secretaria@istpet.edu.ec', password: defaultPassword, firstName: 'María', lastName: 'López', dni: '0000000002', role: 'SECRETARIA' }
  });

  const doc1 = await prisma.user.create({
    data: { email: 'docente1@istpet.edu.ec', password: defaultPassword, firstName: 'Carlos', lastName: 'Mendoza', dni: '0000000003', role: 'DOCENTE', careerId: careers[0].id }
  });

  const doc2 = await prisma.user.create({
    data: { email: 'docente2@istpet.edu.ec', password: defaultPassword, firstName: 'Ana', lastName: 'Torres', dni: '0000000004', role: 'DOCENTE', careerId: careers[1].id }
  });

  console.log('🎓 Creando alumnos...');
  const alumnos = [];
  for (let i = 1; i <= 15; i++) {
    const career = careers[i % careers.length];
    const alumno = await prisma.user.create({
      data: {
        email: `alumno${i}@istpet.edu.ec`,
        password: defaultPassword,
        firstName: `Estudiante`,
        lastName: `Número ${i}`,
        dni: `17000000${i.toString().padStart(2, '0')}`,
        role: 'ALUMNO',
        careerId: career.id,
      }
    });
    alumnos.push(alumno);
  }

  console.log('📅 Creando eventos...');
  const events = [
    // --- EVENTOS PASADOS ---
    {
      title: 'Charla: Ciberseguridad Básica',
      description: 'Conceptos fundamentales de protección de datos.',
      startDate: addDays(now, -10, 9), endDate: addDays(now, -10, 13),
      hours: 4, capacity: 50, isTransversal: true, careers: []
    },
    {
      title: 'Workshop: Inteligencia Artificial',
      description: 'Uso de LLMs en el desarrollo de software.',
      startDate: addDays(now, -5, 14), endDate: addDays(now, -5, 18),
      hours: 4, capacity: 30, isTransversal: false, careers: [careers[0], careers[4]]
    },
    // --- EVENTOS FUTUROS ---
    {
      title: 'Feria de Emprendimiento',
      description: 'Proyectos de los estudiantes de Administración.',
      startDate: addDays(now, 5, 9), endDate: addDays(now, 5, 15),
      hours: 6, capacity: 100, isTransversal: true, careers: []
    },
    {
      title: 'Taller de Python para Datos',
      description: 'Machine learning básico.',
      startDate: addDays(now, 10, 10), endDate: addDays(now, 10, 16),
      hours: 6, capacity: 25, isTransversal: false, careers: [careers[0]]
    }
  ];

  const dbEvents = [];
  for (const { careers: evCareers, ...data } of events) {
    const ev = await prisma.event.create({
      data: {
        ...data, latitude: ISTPET_LAT, longitude: ISTPET_LNG, radiusMeters: 200,
        careers: evCareers.length > 0 ? { connect: evCareers.map(c => ({ id: c.id })) } : undefined,
      },
    });
    dbEvents.push(ev);
  }

  console.log('✅ Simulando registros, asistencias y encuestas...');
  const pastEvent1 = dbEvents[0];
  const pastEvent2 = dbEvents[1];

  // Inscribir alumnos a eventos pasados
  for (let i = 0; i < 10; i++) {
    const student = alumnos[i];
    
    // Evento 1
    await prisma.eventRegistration.create({ data: { eventId: pastEvent1.id, userId: student.id } });
    
    // Simular asistencia válida (Check In y Check Out)
    await prisma.eventAttendance.create({
      data: {
        eventId: pastEvent1.id, userId: student.id,
        latitude: ISTPET_LAT, longitude: ISTPET_LNG, photoUrl: '/mock.jpg', isValid: true,
        recordedAt: pastEvent1.startDate,
        checkOutAt: pastEvent1.endDate,
        checkOutLatitude: ISTPET_LAT, checkOutLongitude: ISTPET_LNG, isCheckOutValid: true
      }
    });

    // Simular encuesta
    await prisma.survey.create({
      data: {
        eventId: pastEvent1.id, userId: student.id,
        rating: Math.floor(Math.random() * 2) + 4, // 4 o 5
        feedback: 'Excelente evento, aprendí mucho.'
      }
    });
  }

  // Evento 2 (solo 5 alumnos)
  for (let i = 0; i < 5; i++) {
    const student = alumnos[i];
    await prisma.eventRegistration.create({ data: { eventId: pastEvent2.id, userId: student.id } });
    await prisma.eventAttendance.create({
      data: {
        eventId: pastEvent2.id, userId: student.id,
        latitude: ISTPET_LAT, longitude: ISTPET_LNG, photoUrl: '/mock.jpg', isValid: true,
        recordedAt: pastEvent2.startDate,
        checkOutAt: pastEvent2.endDate,
        checkOutLatitude: ISTPET_LAT, checkOutLongitude: ISTPET_LNG, isCheckOutValid: true
      }
    });
  }

  console.log('🎉 Simulación completada con éxito.');
  console.log('--------------------------------------------------');
  console.log('🔑 Credenciales de prueba generadas (Contraseña: password123)');
  console.log(' - Admin:      admin@istpet.edu.ec');
  console.log(' - Secretaria: secretaria@istpet.edu.ec');
  console.log(' - Docente 1:  docente1@istpet.edu.ec');
  console.log(' - Docente 2:  docente2@istpet.edu.ec');
  console.log(' - Alumnos:    alumno1@istpet.edu.ec hasta alumno15@istpet.edu.ec');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
