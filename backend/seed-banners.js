const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBanners() {
  console.log('🌱 Expanding Banners to 20 rows...');
  
  try {
    // 1. Fetch available active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 100, // Get a good pool
      orderBy: { createdAt: 'desc' }
    });

    if (products.length === 0) {
      console.log('⚠️ No products found to feature in banners.');
      return;
    }

    // Clear existing banners to avoid duplicates if preferred, 
    // or just add more. I will just add 20 fresh ones.
    // await prisma.banner.deleteMany({}); 

    const bannerNames = [
      'Nouveautés Tech', 'Mode Été 2026', 'Meilleures Ventes Amazon', 
      'Exclusivités AliExpress', 'Trouvailles eBay', 'Gadgets Cuisine',
      'Équipement Sport', 'Beauté & Soins', 'Déco Maison Slim',
      'Promotions Flash', 'Sélection Premium', 'Cadeaux Homme',
      'Cadeaux Femme', 'Bons Plans Tech', 'Smart Home Deals',
      'Tendance Sneakers', 'Accessoires Gamer', 'Hifi Box Selection',
      'Outdoor Gear', 'Health & Vitality'
    ];

    for (let i = 0; i < 20; i++) {
        // Shuffle products for each banner to get variety
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 6);
        
        const name = bannerNames[i] || `Banner Promo ${i + 1}`;
        const positions = ['top', 'sidebar', 'footer', 'middle'];
        const position = positions[Math.floor(Math.random() * positions.length)];

        await prisma.banner.create({
            data: {
                name: name,
                position: position,
                active: true,
                product1Id: selected[0]?.id,
                product2Id: selected[1]?.id,
                product3Id: selected[2]?.id,
                product4Id: selected[3]?.id,
                product5Id: selected[4]?.id,
                product6Id: selected[5]?.id,
            }
        });
        console.log(`✅ Created Banner: ${name}`);
    }

    console.log('🎉 Successfully created 20 banners.');

  } catch (error) {
    console.error('❌ Error seeding banners:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBanners();
