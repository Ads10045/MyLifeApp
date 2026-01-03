const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load prod env explicitly
const envProdPath = path.join(__dirname, '../.env.production');
if (!fs.existsSync(envProdPath)) {
  console.error('❌ .env.production not found');
  process.exit(1);
}
const envProd = dotenv.parse(fs.readFileSync(envProdPath));
const DATABASE_URL = envProd.DATABASE_URL;

console.log('Using Prod URL:', DATABASE_URL.split('@')[1]); // Hide credentials

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

async function verify() {
  try {
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    
    console.log('📊 Verification Results (Neon Production):');
    console.log(`   👤 Users: ${userCount}`);
    console.log(`   📦 Products: ${productCount}`);
    
    if (productCount === 0) {
        console.log('⚠️ No products found! Cloning might have failed silently or connection is wrong.');
    } else {
        console.log('✅ Data is present.');
        
        // List first 5 products to prove it's real data
        const products = await prisma.product.findMany({ take: 5, select: { name: true } });
        console.log('📝 Sample Products in Neon:');
        products.forEach(p => console.log(`   - ${p.name}`));
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
