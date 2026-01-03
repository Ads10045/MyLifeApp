const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupProducts() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // Count products before cleanup
    const totalCount = await prisma.product.count();
    console.log(`📊 Total products before cleanup: ${totalCount}`);

    // Delete products that are NOT from Amazon or AliExpress
    const result = await prisma.product.deleteMany({
      where: {
        AND: [
          { supplier: { not: 'Amazon' } },
          { supplier: { not: 'AliExpress' } }
        ]
      }
    });

    console.log(`✅ Deleted ${result.count} non-affiliate products.`);
    
    // Count remaining
    const remainingCount = await prisma.product.count();
    console.log(`📊 Total products remaining: ${remainingCount}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupProducts();
