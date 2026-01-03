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

    // Base URL for GitHub Assets
    const GITHUB_BASE_URL = "https://raw.githubusercontent.com/Ads10045/MyLifeApp/main";

    const bannerConfigs = [
      { name: 'Promo Masque Pêche', path: `${GITHUB_BASE_URL}/banners/peach-mask-promo.html` },
      { name: 'Bashasaray Collection', path: `${GITHUB_BASE_URL}/banners/bashasaray-banners.html` },
      { name: 'CAN Morocco 2025', path: `${GITHUB_BASE_URL}/banners/can-morocco-2025.html` },
      { name: 'Celebration Multi', path: `${GITHUB_BASE_URL}/banners/celebration-banners-multilingual.html` },
      { name: 'iCommerce Special', path: `${GITHUB_BASE_URL}/banners/icommerce-2.html` },
      { name: 'Korean Style Deals', path: `${GITHUB_BASE_URL}/banners/korean-celebration-banners.html` },
      { name: 'Nouveautés Tech' },
      { name: 'Mode Été 2026' },
      { name: 'Meilleures Ventes Amazon' },
      { name: 'Exclusivités AliExpress' },
      { name: 'Trouvailles eBay' },
      { name: 'Gadgets Cuisine' },
      { name: 'Équipement Sport' },
      { name: 'Beauté & Soins' },
      { name: 'Déco Maison Slim' },
      { name: 'Promotions Flash' },
      { name: 'Sélection Premium' },
      { name: 'Cadeaux Homme' },
      { name: 'Cadeaux Femme' },
      { name: 'Smart Home Deals' }
    ];

    const availablePaths = bannerConfigs.slice(0, 6).map(c => c.path);

    for (let i = 0; i < bannerConfigs.length; i++) {
        const config = bannerConfigs[i];
        // Cycle through available paths if not explicitly provided
        const bannerPath = config.path || availablePaths[i % availablePaths.length];
        
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 6);
        
        const positions = ['top', 'sidebar', 'footer', 'middle'];
        const position = i < 6 ? 'top' : positions[Math.floor(Math.random() * positions.length)];

        const banner = await prisma.banner.create({
            data: {
                name: config.name,
                position: positions[i % positions.length],
                path: bannerPath,
                active: true,
                product1Id: selected[0]?.id,
                product2Id: selected[1]?.id,
                product3Id: selected[2]?.id,
                product4Id: selected[3]?.id,
                product5Id: selected[4]?.id,
                product6Id: selected[5]?.id,
            }
        });
        console.log(`✅ Created Banner: ${config.name} (Path: ${bannerPath})`);
    }

    console.log('🎉 Successfully re-seeded 20 banners with paths.');

  } catch (error) {
    console.error('❌ Error seeding banners:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBanners();
