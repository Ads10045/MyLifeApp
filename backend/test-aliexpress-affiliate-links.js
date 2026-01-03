const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test AliExpress affiliate link generation
async function testAliExpressLinks() {
  console.log('🔍 Testing AliExpress affiliate link generation...\n');
  
  try {
    // Fetch a sample AliExpress product
    const product = await prisma.product.findFirst({
      where: { supplier: 'AliExpress' }
    });

    if (!product) {
      console.log('❌ No AliExpress products found in database.');
      return;
    }

    console.log('📦 Sample Product:', product.name);
    console.log('🔗 Original URL:', product.sourceUrl);

    // Generate affiliate link
    const trackingId = 'nutriplusap';
    const paramName = 'aff_id';
    
    if (!product.sourceUrl) {
      console.log('⚠️ Product has no sourceUrl!');
      return;
    }

    const separator = product.sourceUrl.includes('?') ? '&' : '?';
    const affiliateLink = `${product.sourceUrl}${separator}${paramName}=${trackingId}`;

    console.log('✅ Affiliate Link:', affiliateLink);
    console.log('\n✓ Link includes tracking ID:', affiliateLink.includes(trackingId));
    console.log('✓ Link includes param name:', affiliateLink.includes(paramName));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAliExpressLinks();
