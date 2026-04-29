import prisma from './src/prismaClient';
import bcrypt from 'bcryptjs';

async function main() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('alumno123', salt);
  
  await prisma.user.update({
    where: { email: 'testalumno1@istpet.edu.ec' },
    data: { password: hashedPassword }
  });
  console.log('Password reset successfully to alumno123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
