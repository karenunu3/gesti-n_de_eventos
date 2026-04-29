import prisma from './prismaClient';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Iniciando el seeder...');

  // Crear carreras
  const carreraSistemas = await prisma.career.upsert({
    where: { name: 'Desarrollo de Software' },
    update: {},
    create: { name: 'Desarrollo de Software' },
  });

  // Hashear password por defecto
  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordAlumno = await bcrypt.hash('alumno123', 10);

  // Crear Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@istpet.edu.ec' },
    update: {},
    create: {
      email: 'admin@istpet.edu.ec',
      password: passwordAdmin,
      firstName: 'Administrador',
      lastName: 'Principal',
      dni: '1700000000',
      role: 'ADMIN',
    },
  });

  // Crear Alumno
  const alumno = await prisma.user.upsert({
    where: { email: 'alumno@istpet.edu.ec' },
    update: {},
    create: {
      email: 'alumno@istpet.edu.ec',
      password: passwordAlumno,
      firstName: 'Juan',
      lastName: 'Pérez',
      dni: '1700000001',
      role: 'ALUMNO',
      careerId: carreraSistemas.id,
    },
  });

  // Crear Evento
  const evento = await prisma.event.create({
    data: {
      title: 'Feria de Innovación Tecnológica 2026',
      description: 'Evento anual donde se presentan los mejores proyectos de desarrollo de software del ISTPET.',
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 4 * 60 * 60 * 1000), // + 4 horas
      capacity: 100,
      hours: 4,
      latitude: -0.22985, // Coordenadas de ejemplo (Quito)
      longitude: -78.52495,
      radiusMeters: 500, // 500 metros de tolerancia
      isTransversal: true,
    },
  });

  console.log('¡Base de datos poblada con éxito!');
  console.log({
    Admin: admin.email + ' / admin123',
    Alumno: alumno.email + ' / alumno123',
    EventoGenerado: evento.title
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
