import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Database...');

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  // 1. Create ADMIN user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@prysm.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@prysm.com',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // 2. Create EMPLOYEE users
  const empPassword = await bcrypt.hash('Employee@123', 10);
  
  const emp1 = await prisma.user.upsert({
    where: { email: 'john@prysm.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@prysm.com',
      password: empPassword,
      role: Role.EMPLOYEE,
    },
  });
  
  const emp2 = await prisma.user.upsert({
    where: { email: 'jane@prysm.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'jane@prysm.com',
      password: empPassword,
      role: Role.EMPLOYEE,
    },
  });

  console.log(`Created employees: ${emp1.email}, ${emp2.email}`);

  // 3. Create a Customer
  const customer = await prisma.customer.upsert({
    where: { email: 'acme@test.com' },
    update: {},
    create: {
      name: 'Acme Corp',
      email: 'acme@test.com',
      phone: '1234567890',
      company: 'Acme Co.',
    },
  });
  console.log(`Created customer: ${customer.name}`);

  // 4. Create a Task for the customer, assigned to emp1 (idempotent)
  const existingTask = await prisma.task.findFirst({
    where: { title: 'Setup Acme Account', customerId: customer.id },
  });
  if (!existingTask) {
    await prisma.task.create({
      data: {
        title: 'Setup Acme Account',
        description: 'Initial onboarding for Acme Corp',
        customerId: customer.id,
        assignedToId: emp1.id,
        status: 'PENDING',
      },
    });
    console.log('Created sample task');
  } else {
    console.log('Sample task already exists, skipping');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
