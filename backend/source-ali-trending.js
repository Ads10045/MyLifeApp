const { PrismaClient } = require('@prisma/client');
const rapid = require('./services/rapidAPIService');
const prisma = new PrismaClient();

async function sourceAliTrending() {
  console.log('🚀 Sourcing AliExpress Trending Deals...');
  
  try {
    const products = await rapid.searchAliExpress('trending'); // Search for overall trending items
    console.log(`💡 Received ${products.length} products from API.`);

    let imported = 0;
    for (const p of products) {
      await prisma.product.upsert({
        where: { supplierId: p.supplierId },
        create: {
          id: require('crypto').randomUUID(),
          ...p,
          category: 'Trending',
          updatedAt: new Date()
        },
        update: { ...p, updatedAt: new Date() }
      });
      imported++;
      console.log(`✅ [${imported}] ${p.name}`);
    }
    
    console.log(`🎉 Successfully imported ${imported} AliExpress products.`);
  } catch (err) {
    console.error('❌ Sourcing failed:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

sourceAliTrending();
