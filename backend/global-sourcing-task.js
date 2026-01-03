require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const rapidAPIService = require('./services/rapidAPIService');
const crypto = require('crypto');

const prisma = new PrismaClient();

const CATEGORIES = ['Tech', 'Mode', 'Maison', 'Sport', 'Beauté', 'Cuisine'];
const SEARCH_KEYWORDS = {
  'Tech': 'latest gadget 2025',
  'Mode': 'trending fashion',
  'Maison': 'smart home decor',
  'Sport': 'fitness equipment',
  'Beauté': 'best skincare 2025',
  'Cuisine': 'useful kitchen tools'
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function runGlobalSourcing() {
  console.log('🌍 DÉMARRAGE DU SOURCING GLOBAL (Toutes catégories, Amazon + AliExpress)...');
  
  let totalImported = 0;

  for (const category of CATEGORIES) {
    console.log(`\n--- 📂 NAVIGATION : ${category.toUpperCase()} ---`);
    const query = SEARCH_KEYWORDS[category];
    
    // 1. Fetch from Amazon
    console.log(`   📦 Amazon: Recherche "${query}"...`);
    try {
        const amzProducts = await rapidAPIService.searchAmazon(query, 5);
        console.log(`   ✅ ${amzProducts.length} produits trouvés sur Amazon`);
        totalImported += await importProducts(amzProducts, category);
    } catch (e) {
        console.error(`   ❌ Erreur Amazon (${category}):`, e.message);
    }

    await delay(15000); // Pause anti-429 plus longue

    // 2. Fetch from AliExpress
    console.log(`   🛍️ AliExpress: Recherche...`);
    try {
        const aliProducts = await rapidAPIService.searchAliExpress(query, 5);
        console.log(`   ✅ ${aliProducts.length} produits trouvés sur AliExpress`);
        totalImported += await importProducts(aliProducts, category);
    } catch (e) {
        console.error(`   ❌ Erreur AliExpress (${category}):`, e.message);
    }

    await delay(15000); // Pause anti-429 plus longue
  }

  console.log(`\n✨ SOURCING GLOBAL TERMINÉ !`);
  console.log(`📊 TOTAL IMPORTÉ : ${totalImported} produits.`);
  await prisma.$disconnect();
}

async function importProducts(products, category) {
    let count = 0;
    for (const p of products) {
        try {
            const margin = ((p.price - p.supplierPrice) / p.price) * 100;
            await prisma.product.upsert({
                where: { supplierId: p.supplierId },
                create: {
                    id: crypto.randomUUID(),
                    name: p.name,
                    description: p.description,
                    price: parseFloat(p.price),
                    supplierPrice: parseFloat(p.supplierPrice),
                    margin: margin,
                    imageUrl: p.imageUrl,
                    images: p.images || [p.imageUrl],
                    sourceUrl: p.link || null,
                    category: category,
                    supplier: p.supplier,
                    supplierId: p.supplierId,
                    isActive: true,
                    updatedAt: new Date()
                },
                update: {
                    price: parseFloat(p.price),
                    supplierPrice: parseFloat(p.supplierPrice),
                    margin: margin,
                    sourceUrl: p.link || null,
                    isActive: true,
                    updatedAt: new Date()
                }
            });
            count++;
        } catch (err) {
            console.error(`      ⚠️ Échec import pour "${p.name?.substring(0, 20)}...":`, err.message);
        }
    }
    return count;
}

runGlobalSourcing();
