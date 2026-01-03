const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Nettoyer les données existantes
  await prisma.location.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Données existantes supprimées');

  // Créer des utilisateurs
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Créer un administrateur
  const admin = await prisma.user.create({
    data: {
      name: 'Admin NutriPlus',
      email: 'admin@nutriplus.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'Alice Dupont',
      email: 'alice@nutriplus.com',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Bob Martin',
      email: 'bob@nutriplus.com',
      password: hashedPassword,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Charlie Dubois',
      email: 'charlie@nutriplus.com',
      password: hashedPassword,
    },
  });

  console.log('✅ 4 utilisateurs créés (1 admin + 3 users, mot de passe: password123)');

  // Créer des commandes pour Alice
  await prisma.order.create({
    data: {
      userId: user1.id,
      total: 9.90,
      items: JSON.stringify([
        { id: '1', name: 'Guide Meal Prep (7j)', price: 9.90, quantity: 1 }
      ]),
    },
  });

  await prisma.order.create({
    data: {
      userId: user1.id,
      total: 34.40,
      items: JSON.stringify([
        { id: '2', name: 'Programme Détox 30j', price: 19.90, quantity: 1 },
        { id: '5', name: 'T-Shirt Bio "Healthy"', price: 19.90, quantity: 1 }
      ]),
    },
  });

  // Créer des commandes pour Bob
  await prisma.order.create({
    data: {
      userId: user2.id,
      total: 89.00,
      items: JSON.stringify([
        { id: '9', name: 'Blender Pro 2000W', price: 89.00, quantity: 1 }
      ]),
    },
  });

  console.log('✅ 3 commandes créées');

  // Créer des emplacements GPS pour Alice (Paris)
  await prisma.location.create({
    data: {
      userId: user1.id,
      latitude: 48.8566,
      longitude: 2.3522,
      address: 'Tour Eiffel, 75007 Paris, France',
      street: 'Champ de Mars',
      city: 'Paris',
      postalCode: '75007',
      region: 'Île-de-France',
      country: 'France',
    },
  });

  await prisma.location.create({
    data: {
      userId: user1.id,
      latitude: 48.8606,
      longitude: 2.3376,
      address: 'Musée du Louvre, 75001 Paris, France',
      street: 'Rue de Rivoli',
      city: 'Paris',
      postalCode: '75001',
      region: 'Île-de-France',
      country: 'France',
    },
  });

  // Créer des emplacements GPS pour Bob (Lyon)
  await prisma.location.create({
    data: {
      userId: user2.id,
      latitude: 45.7640,
      longitude: 4.8357,
      address: 'Place Bellecour, 69002 Lyon, France',
      street: 'Place Bellecour',
      city: 'Lyon',
      postalCode: '69002',
      region: 'Auvergne-Rhône-Alpes',
      country: 'France',
    },
  });

  // Créer des emplacements GPS pour Charlie (Marseille)
  await prisma.location.create({
    data: {
      userId: user3.id,
      latitude: 43.2965,
      longitude: 5.3698,
      address: 'Vieux-Port de Marseille, 13001 Marseille, France',
      street: 'Quai du Port',
      city: 'Marseille',
      postalCode: '13001',
      region: 'Provence-Alpes-Côte d\'Azur',
      country: 'France',
    },
  });

  console.log('✅ 4 emplacements GPS créés');

  // Statistiques finales
  const userCount = await prisma.user.count();
  const orderCount = await prisma.order.count();
  const locationCount = await prisma.location.count();

  console.log('\n📊 Base de données alimentée avec succès !');
  console.log(`👥 Utilisateurs: ${userCount}`);
  console.log(`🛍️  Commandes: ${orderCount}`);
  console.log(`📍 Emplacements GPS: ${locationCount}`);
  console.log('\n🔐 Credentials de test:');
  console.log('   🔑 ADMIN: admin@nutriplus.com / password123');
  console.log('   alice@nutriplus.com / password123');
  console.log('   bob@nutriplus.com / password123');
  console.log('   charlie@nutriplus.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
