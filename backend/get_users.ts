import prisma from './src/prismaClient';

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SECRETARIA'] } },
    select: { email: true, firstName: true, lastName: true, role: true }
  });
  console.log(users);
}
main().finally(() => prisma.$disconnect());
