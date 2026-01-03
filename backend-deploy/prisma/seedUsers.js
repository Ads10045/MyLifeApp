const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = new PrismaClient();

const users = [
  { name: 'Marie Martin', email: 'marie.martin@email.com' },
  { name: 'Jean Dupont', email: 'jean.dupont@email.com' },
  { name: 'Sophie Bernard', email: 'sophie.bernard@email.com' },
  { name: 'Pierre Durand', email: 'pierre.durand@email.com' },
  { name: 'Camille Leroy', email: 'camille.leroy@email.com' },
  { name: 'Thomas Moreau', email: 'thomas.moreau@email.com' },
  { name: 'Emma Petit', email: 'emma.petit@email.com' },
  { name: 'Lucas Simon', email: 'lucas.simon@email.com' },
  { name: 'Chloé Laurent', email: 'chloe.laurent@email.com' },
  { name: 'Hugo Michel', email: 'hugo.michel@email.com' }
];

async function seed() {
  console.log('🌱 Seeding 10 users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: crypto.randomUUID(),
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: 'USER',
        updatedAt: new Date()
      }
    });
    console.log('✅ Created:', u.name);
  }
  
  const count = await prisma.user.count();
  console.log(`\n📊 Total users in database: ${count}`);
  await prisma.$disconnect();
}

seed().catch(console.error);
