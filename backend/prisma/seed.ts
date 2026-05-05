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

// Helper para crear fechas relativas al día de hoy
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
  await prisma.career.deleteMany();

  console.log('📚 Creando carreras...');
  const careersData = [
    'Desarrollo de Software', 'Diseño Gráfico', 'Mecánica Automotriz',
    'Gastronomía', 'Marketing y Comercio', 'Educación Inicial'
  ];
  const careers = await Promise.all(
    careersData.map(name => prisma.career.upsert({
      where: { name }, update: {}, create: { name }
    }))
  );

  console.log('👥 Creando usuarios (Personal)...');
  await prisma.user.create({
    data: { email: 'admin@istpet.edu.ec', password: defaultPassword, firstName: 'Admin', lastName: 'Sistema', dni: '0000000001', role: 'ADMIN' }
  });

  await prisma.user.create({
    data: { email: 'secretaria@istpet.edu.ec', password: defaultPassword, firstName: 'María', lastName: 'López', dni: '0000000002', role: 'SECRETARIA' }
  });

  const docentes = [];
  for (let i = 1; i <= 3; i++) {
    const doc = await prisma.user.create({
      data: { 
        email: `docente${i}@istpet.edu.ec`, password: defaultPassword, 
        firstName: `Docente`, lastName: `${i}`, dni: `000000010${i}`, 
        role: 'DOCENTE', careerId: careers[i-1].id 
      }
    });
    docentes.push(doc);
  }

  console.log('🎓 Creando 40 alumnos...');
  const alumnos = [];
  const nombres = ['Carlos', 'Ana', 'Luis', 'Marta', 'Pedro', 'Lucía', 'Jorge', 'Sofía', 'Diego', 'Valentina'];
  const apellidos = ['Mendoza', 'Torres', 'Pérez', 'Gómez', 'Silva', 'Ruiz', 'Castro', 'Vargas', 'Ríos', 'Ortiz'];
  
  for (let i = 1; i <= 40; i++) {
    const career = careers[i % careers.length];
    const fname = nombres[i % nombres.length];
    const lname = apellidos[(i + 3) % apellidos.length]; // Desfasar para más variedad
    
    const alumno = await prisma.user.create({
      data: {
        email: `alumno${i}@istpet.edu.ec`,
        password: defaultPassword,
        firstName: fname,
        lastName: `${lname} ${i}`,
        dni: `17000000${i.toString().padStart(2, '0')}`,
        role: 'ALUMNO',
        careerId: career.id,
      }
    });
    alumnos.push({ ...alumno, career });
  }

  console.log('📅 Creando eventos realistas (mes actual)...');
  const events = [
    {
      title: 'Charla: Ciberseguridad Avanzada',
      description: 'Estrategias de defensa contra ataques modernos.',
      startDate: addDays(now, -5, 9), endDate: addDays(now, -5, 13),
      hours: 4, capacity: 50, isTransversal: true, careers: []
    },
    {
      title: 'Taller de React y Node.js',
      description: 'Desarrollo web Fullstack moderno.',
      startDate: addDays(now, -2, 14), endDate: addDays(now, -2, 18),
      hours: 4, capacity: 20, isTransversal: false, careers: [careers[0]] // Software
    },
    {
      title: 'Taller de Inyección Electrónica',
      description: 'Diagnóstico por escáner OBD2.',
      startDate: addDays(now, 0, 8), endDate: addDays(now, 0, 12),
      hours: 4, capacity: 15, isTransversal: false, careers: [careers[2]] // Mecánica
    },
    {
      title: 'Masterclass: UX/UI Design',
      description: 'Diseño centrado en el usuario y prototipado.',
      startDate: addDays(now, 3, 10), endDate: addDays(now, 3, 16),
      hours: 6, capacity: 25, isTransversal: false, careers: [careers[1], careers[0]] // Diseño y Software
    },
    {
      title: 'Feria de Emprendimiento',
      description: 'Exhibición de proyectos de fin de semestre.',
      startDate: addDays(now, 10, 9), endDate: addDays(now, 10, 15),
      hours: 6, capacity: 100, isTransversal: true, careers: []
    },
    {
      title: 'Congreso de Gastronomía Local',
      description: 'Rescate de sabores ecuatorianos.',
      startDate: addDays(now, -12, 10), endDate: addDays(now, -12, 16),
      hours: 6, capacity: 30, isTransversal: false, careers: [careers[3]] // Gastronomía
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
  
  for (const ev of dbEvents) {
    const isPast = ev.endDate < now;
    
    // Inscribir docentes a eventos transversales
    if (ev.isTransversal && isPast) {
      await prisma.eventRegistration.create({ data: { eventId: ev.id, userId: docentes[0].id } });
      await prisma.eventAttendance.create({
        data: {
          eventId: ev.id, userId: docentes[0].id,
          latitude: ISTPET_LAT, longitude: ISTPET_LNG, photoUrl: '/mock.jpg', isValid: true,
          recordedAt: ev.startDate, checkOutAt: ev.endDate,
          checkOutLatitude: ISTPET_LAT, checkOutLongitude: ISTPET_LNG, isCheckOutValid: true
        }
      });
      await prisma.survey.create({
        data: { eventId: ev.id, userId: docentes[0].id, rating: 5, feedback: 'Muy buen evento transversal.' }
      });
    }

    // Seleccionar alumnos elegibles
    let elegibles = alumnos;
    if (!ev.isTransversal) {
      // Evento específico: solo alumnos de esas carreras
      const eventWithCareers = events.find(e => e.title === ev.title);
      if (eventWithCareers) {
        const allowedCareerIds = eventWithCareers.careers.map(c => c.id);
        elegibles = alumnos.filter(a => allowedCareerIds.includes(a.career.id));
      }
    }

    // Mezclar y tomar un número aleatorio de alumnos (hasta llenar capacidad o max elegibles)
    elegibles.sort(() => 0.5 - Math.random());
    const numToRegister = Math.min(ev.capacity, Math.floor(elegibles.length * 0.8)); // 80% de inscritos
    const inscritos = elegibles.slice(0, numToRegister);

    for (const student of inscritos) {
      await prisma.eventRegistration.create({ data: { eventId: ev.id, userId: student.id } });
      
      if (isPast) {
        // 90% de los inscritos asisten
        if (Math.random() > 0.1) {
          const validCheckIn = Math.random() > 0.05; // 95% hacen checkin válido
          const hasCheckOut = Math.random() > 0.1; // 90% hacen checkout
          const validCheckOut = hasCheckOut && Math.random() > 0.05;

          await prisma.eventAttendance.create({
            data: {
              eventId: ev.id, userId: student.id,
              latitude: validCheckIn ? ISTPET_LAT : 0, longitude: validCheckIn ? ISTPET_LNG : 0, 
              photoUrl: '/mock.jpg', isValid: validCheckIn,
              recordedAt: addDays(ev.startDate, 0, Math.random() * 2), // random time around start
              checkOutAt: hasCheckOut ? ev.endDate : null,
              checkOutLatitude: validCheckOut ? ISTPET_LAT : null, checkOutLongitude: validCheckOut ? ISTPET_LNG : null, 
              isCheckOutValid: validCheckOut ? true : null
            }
          });

          // 80% de los que hicieron checkOutVálido llenan la encuesta
          if (validCheckOut && Math.random() > 0.2) {
            await prisma.survey.create({
              data: {
                eventId: ev.id, userId: student.id,
                rating: Math.floor(Math.random() * 2) + 4, // 4 o 5
                feedback: ['Excelente', 'Muy bueno', 'Aprendí mucho', 'Me gustó el enfoque práctico'][Math.floor(Math.random() * 4)]
              }
            });
          }
        }
      }
    }
  }

  console.log('🎉 Simulación completada con éxito.');
  console.log('--------------------------------------------------');
  console.log('🔑 Credenciales de prueba generadas (Contraseña: password123)');
  console.log(' - Admin:      admin@istpet.edu.ec');
  console.log(' - Docente 1:  docente1@istpet.edu.ec');
  console.log(' - Alumnos:    alumno1@istpet.edu.ec hasta alumno40@istpet.edu.ec');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
