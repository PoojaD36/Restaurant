import { PrismaClient } from '../src/database/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash, genSalt } from 'bcrypt';
import { UserRole, UserStatus } from '../src/database/generated/prisma/enums';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seed...');

  // Check if Super Admin already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
  });

  if (existingSuperAdmin) {
    console.log('Super Admin already exists. Skipping seed.');
    return;
  }

  // Create Super Admin
  const saltRounds = 10;
  const salt = await genSalt(saltRounds);
  const passwordHash = await hash('Admin@123', salt);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@restaurant.com',
      phone: '+1234567890',
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      password: {
        create: {
          passwordHash,
        },
      },
    },
  });

  console.log('Super Admin created successfully:');
  console.log('Email:', superAdmin.email);
  console.log('Password: Admin@123');
  console.log('Please change the password after first login!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
