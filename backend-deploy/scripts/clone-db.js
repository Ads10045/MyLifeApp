const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load envs
const envLocal = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
// Try to load prod env if exists, or expect user to set TARGET_DATABASE_URL
let envProd = {};
try {
  envProd = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env.production')));
} catch (e) {
  console.log('⚠️ No .env.production found. Please ensure TARGET_DATABASE_URL is set.');
}

const SOURCE_URL = process.env.DATABASE_URL || envLocal.DATABASE_URL;
const TARGET_URL = process.env.TARGET_DATABASE_URL || envProd.DATABASE_URL;

if (!SOURCE_URL || !TARGET_URL || TARGET_URL.includes('YOUR_PASSWORD_HERE')) {
  console.error('❌ Error: Missing or invalid database URLs.');
  console.error('   Please configure backend/.env.production with your Neon credentials.');
  process.exit(1);
}

console.log('🔄 Initializing cloning process...');
console.log('   Source:', SOURCE_URL.split('@')[1]); // Hide credentials
console.log('   Target:', TARGET_URL.split('@')[1]); 

const localPrisma = new PrismaClient({ datasources: { db: { url: SOURCE_URL } } });
const remotePrisma = new PrismaClient({ datasources: { db: { url: TARGET_URL } } });

async function clone() {
  try {
    // 1. Users
    console.log('👤 Cloning Users...');
    const users = await localPrisma.user.findMany();
    for (const user of users) {
      await remotePrisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: user,
      });
    }
    console.log(`   ✅ ${users.length} users processed.`);

    // 2. Products
    console.log('📦 Cloning Products...');
    const products = await localPrisma.product.findMany();
    for (const product of products) {
      // Avoid ID conflicts by ignoring ID if possible, or using upsert
      // Simple upsert by unique constraint if exists, otherwise create
      // Since ID is auto-increment usually or UUID... 
      // If UUID, easy. If Auto-inc, we might need to reset sequence or just createMany.
      // Let's rely on createMany with skipDuplicates for simplicity if supported, 
      // or just upsert by a unique field if available. Product has 'sourceUrl' which might be unique?
      // Fallback: Delete all remote products first? No, risky. 
      // Let's try to create and catch "unique constraint" errors if IDs clash?
      // Actually standard migration:
      const exists = await remotePrisma.product.findUnique({ where: { id: product.id } });
      if (!exists) {
        await remotePrisma.product.create({ data: product });
      }
    }
    console.log(`   ✅ ${products.length} products processed.`);

    console.log('✅ Database cloned successfully!');
  } catch (error) {
    console.error('❌ Cloning failed:', error);
  } finally {
    await localPrisma.$disconnect();
    await remotePrisma.$disconnect();
  }
}

clone();
