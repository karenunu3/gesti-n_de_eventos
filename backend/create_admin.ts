import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@istpet.edu.ec' },
    update: {},
    create: {
      email: 'admin@istpet.edu.ec',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      dni: '0000000000',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin creado: admin@istpet.edu.ec / admin123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
