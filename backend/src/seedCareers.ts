import prisma from './prismaClient';

async function main() {
  const careers = [
    'Desarrollo de Software',
    'Diseño Gráfico',
    'Entrenamiento Deportivo',
    'Educación Inicial',
    'Mecánica Automotriz',
    'Educación Básica',
    'Electrónica',
    'Gastronomía',
    'Redes y Telecomunicaciones',
    'Contabilidad y Asesoría Tributaria',
    'Educación Inclusiva',
    'Marketing y Comercio Electrónico',
    'Talento Humano'
  ];

  for (const career of careers) {
    await prisma.career.upsert({
      where: { name: career },
      update: {},
      create: { name: career }
    });
  }
  console.log('Carreras insertadas correctamente');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
