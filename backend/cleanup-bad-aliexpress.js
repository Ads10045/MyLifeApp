const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupBadAliExpressProducts() {
  console.log('🧹 Cleaning up problematic AliExpress products...');
  
  try {
    // Count AliExpress products before cleanup
    const totalAliExpress = await prisma.product.count({
      where: { supplier: 'AliExpress' }
    });
    console.log(`📊 Total AliExpress products: ${totalAliExpress}`);

    // Delete AliExpress products with problems:
    // 1. Placeholder images (via.placeholder.com or unsplash default)
    // 2. Missing images (empty array or null)
    // 3. Missing essential data
    const result = await prisma.product.deleteMany({
      where: {
        AND: [
          { supplier: 'AliExpress' },
          {
            OR: [
              { imageUrl: { contains: 'placeholder' } },
              { imageUrl: { contains: 'unsplash' } },
              { imageUrl: { startsWith: '//' } }, // Protocol-relative URLs that weren't fixed
              { images: { isEmpty: true } },
              { name: { equals: '' } },
              { price: { lte: 0 } }
            ]
          }
        ]
      }
    });

    console.log(`✅ Deleted ${result.count} problematic AliExpress products.`);
    
    // Count remaining good AliExpress products
    const remainingAliExpress = await prisma.product.count({
      where: { supplier: 'AliExpress' }
    });
    console.log(`📊 Remaining good AliExpress products: ${remainingAliExpress}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupBadAliExpressProducts();
