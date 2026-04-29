import prisma from './prismaClient';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('--- Iniciando Seed de Prueba ---');

  // 1. Obtener carreras existentes (asumiendo que ya se corrió seedCareers)
  const careers = await prisma.career.findMany();
  if (careers.length === 0) {
    console.log('No hay carreras en la BD. Por favor, corre seedCareers.ts primero.');
    return;
  }

  // 2. Crear Alumnos Falsos
  console.log('Creando alumnos de prueba...');
  const passwordHash = await bcrypt.hash('alumno123', 10);
  const fakeUsers = [];
  
  for (let i = 1; i <= 20; i++) {
    const randomCareer = careers[Math.floor(Math.random() * careers.length)];
    try {
      const user = await prisma.user.upsert({
        where: { email: `testalumno${i}@istpet.edu.ec` },
        update: { password: passwordHash },
        create: {
          firstName: `AlumnoTest ${i}`,
          lastName: `Apellido ${i}`,
          email: `testalumno${i}@istpet.edu.ec`,
          dni: `17000000${i.toString().padStart(2, '0')}${Math.floor(Math.random() * 100)}`,
          password: passwordHash,
          role: 'ALUMNO',
          careerId: randomCareer.id
        }
      });
      fakeUsers.push(user);
    } catch (e) {
      console.log(`Skipping alumno ${i} due to error`);
      const existing = await prisma.user.findUnique({ where: { email: `testalumno${i}@istpet.edu.ec` }});
      if (existing) fakeUsers.push(existing);
    }
  }

  // 3. Crear Docentes Falsos
  console.log('Creando docentes de prueba...');
  const docPasswordHash = await bcrypt.hash('docente123', 10);
  for (let i = 1; i <= 3; i++) {
    await prisma.user.upsert({
      where: { email: `docente${i}@istpet.edu.ec` },
      update: { password: docPasswordHash },
      create: {
        firstName: `DocenteTest ${i}`,
        lastName: `Apellido ${i}`,
        email: `docente${i}@istpet.edu.ec`,
        dni: `09000000${i.toString().padStart(2, '0')}`,
        password: docPasswordHash,
        role: 'DOCENTE',
        careerId: careers[i % careers.length].id
      }
    });
  }

  // 4. Crear Eventos Falsos
  console.log('Creando eventos de prueba...');
  const fakeEvents = [];
  const eventNames = [
    'Congreso de Innovación Tecnológica 2026',
    'Seminario de Diseño y UX',
    'Taller de Redes Cisco',
    'Charla sobre Inclusión Educativa',
    'Hackathon de Software Local',
    'Feria Gastronómica ISTPET',
    'Torneo Deportivo Institucional',
    'Seminario de Marketing Digital',
    'Taller de Reparación de Motores',
    'Conferencia de Asesoría Tributaria'
  ];

  for (let i = 0; i < eventNames.length; i++) {
    const isTransversal = i % 2 === 0; // Mitad transversales, mitad específicos
    const date = new Date();
    date.setDate(date.getDate() + (i - 5)); // Algunos en el pasado, otros en el futuro

    const event = await prisma.event.create({
      data: {
        title: eventNames[i],
        description: `Descripción automatizada para el evento de prueba ${eventNames[i]}.`,
        startDate: date,
        endDate: new Date(date.getTime() + 4 * 60 * 60 * 1000), // 4 horas después
        capacity: 50,
        hours: 4,
        latitude: -0.297495, // Coordenadas aproximadas de Chillogallo
        longitude: -78.549219,
        radiusMeters: 500,
        isTransversal,
        careers: isTransversal ? undefined : {
          connect: [{ id: careers[i % careers.length].id }]
        }
      }
    });
    fakeEvents.push(event);
  }

  // 5. Inscribir alumnos y generar asistencias (Solo para eventos pasados o actuales)
  console.log('Generando inscripciones y asistencias...');
  const now = new Date();

  for (const event of fakeEvents) {
    // Escoger entre 5 y 15 alumnos aleatorios para cada evento
    const numStudents = Math.floor(Math.random() * 11) + 5;
    const shuffledUsers = [...fakeUsers].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffledUsers.slice(0, numStudents);

    for (const user of selectedUsers) {
      // Registrar
      await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          userId: user.id
        }
      });

      // Si el evento ya ocurrió, generar asistencia
      if (event.startDate < now) {
        const isAttended = Math.random() > 0.2; // 80% asistió
        if (isAttended) {
          const isGpsValid = Math.random() > 0.15; // 85% con GPS válido
          
          await prisma.eventAttendance.create({
            data: {
              eventId: event.id,
              userId: user.id,
              latitude: isGpsValid ? event.latitude! + 0.0001 : event.latitude! + 0.05, // Válido o Inválido geográficamente
              longitude: isGpsValid ? event.longitude! - 0.0001 : event.longitude! + 0.05,
              photoUrl: 'fake-photo-url.jpg',
              isValid: isGpsValid
            }
          });

          // Si fue válido, generamos certificado
          if (isGpsValid) {
            await prisma.certificate.create({
              data: {
                eventId: event.id,
                userId: user.id,
                hoursGranted: event.hours,
                pdfUrl: 'fake-pdf-url.pdf'
              }
            });
          }
        }
      }
    }
  }

  console.log('--- Seed completado exitosamente ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
