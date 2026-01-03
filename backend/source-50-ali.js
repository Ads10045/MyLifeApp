const { PrismaClient } = require('@prisma/client');
const rapid = require('./services/rapidAPIService');
const prisma = new PrismaClient();

async function source50Ali() {
  console.log('🚀 Sourcing 50 fresh AliExpress products...');
  const queries = ['electronics', 'gadgets', 'fitness', 'kitchen', 'outdoors', 'toys', 'tools', 'automotive', 'decor', 'jewelry'];
  let total = 0;

  for (const q of queries) {
    if (total >= 50) break;
    console.log(`🔍 Query: ${q}...`);
    const products = await rapid.searchAliExpress(q, 10);
    
    for (const p of products) {
      if (total >= 50) break;
      await prisma.product.upsert({
        where: { supplierId: p.supplierId },
        create: {
          id: require('crypto').randomUUID(),
          ...p,
          category: q,
          updatedAt: new Date()
        },
        update: { ...p, updatedAt: new Date() }
      });
      total++;
      console.log(`✅ [${total}/50] ${p.name}`);
    }
  }
  console.log('🎉 Done!');
  process.exit(0);
}

source50Ali();
