const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Check if Banner table exists (by trying to count)
    const bannerCount = await prisma.banner.count();
    console.log(`✅ Banner table exists (count: ${bannerCount})`);

    // Check Product table data preservation
    const productCount = await prisma.product.count();
    console.log(`✅ Product table exists (count: ${productCount})`);
    
    // Check User table data preservation
    const userCount = await prisma.user.count();
    console.log(`✅ User table exists (count: ${userCount})`);
    
  } catch (e) {
    console.error('❌ Verification failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
