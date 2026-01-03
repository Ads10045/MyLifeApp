const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBanners() {
  console.log('🌱 Expanding Banners with local assets...');
  
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 100,
      orderBy: { createdAt: 'desc' }
    });

    if (products.length === 0) {
      console.log('⚠️ No products found to feature in banners.');
      return;
    }

    // Delete existing banners to refresh with paths
    await prisma.banner.deleteMany({}); 

    const bannerConfigs = [
      { name: 'Promo Masque Pêche', path: '/banners/peach-mask-promo.html' },
      { name: 'Bashasaray Collection', path: '/banners/bashasaray-banners.html' },
      { name: 'CAN Morocco 2025', path: '/banners/can-morocco-2025.html' },
      { name: 'Celebration Multi', path: '/banners/celebration-banners-multilingual.html' },
      { name: 'iCommerce Special', path: '/banners/icommerce-2.html' },
      { name: 'Korean Style Deals', path: '/banners/korean-celebration-banners.html' },
      { name: 'Nouveautés Tech', path: null },
      { name: 'Mode Été 2026', path: null },
      { name: 'Meilleures Ventes Amazon', path: null },
      { name: 'Exclusivités AliExpress', path: null },
      { name: 'Trouvailles eBay', path: null },
      { name: 'Gadgets Cuisine', path: null },
      { name: 'Équipement Sport', path: null },
      { name: 'Beauté & Soins', path: null },
      { name: 'Déco Maison Slim', path: null },
      { name: 'Promotions Flash', path: null },
      { name: 'Sélection Premium', path: null },
      { name: 'Cadeaux Homme', path: null },
      { name: 'Cadeaux Femme', path: null },
      { name: 'Smart Home Deals', path: null }
    ];

    for (let i = 0; i < bannerConfigs.length; i++) {
        const config = bannerConfigs[i];
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 6);
        
        const positions = ['top', 'sidebar', 'footer', 'middle'];
        const position = i < 6 ? 'top' : positions[Math.floor(Math.random() * positions.length)];

        await prisma.banner.create({
            data: {
                name: config.name,
                path: config.path,
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
        console.log(`✅ Created Banner: ${config.name} (Path: ${config.path})`);
    }

    console.log('🎉 Successfully re-seeded 20 banners with paths.');

  } catch (error) {
    console.error('❌ Error seeding banners:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBanners();
