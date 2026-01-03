require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const rapidAPIService = require('./services/rapidAPIService');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function runAliSourcing() {
  console.log('🚀 Démarrage du sourcing AliExpress ciblé...');
  
  const categories = ['Tech', 'Mode', 'Maison', 'Sport'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const query = 'usb cable';

  try {
    console.log(`🔍 Recherche de produits "${query}" dans la catégorie "${category}"...`);
    const products = await rapidAPIService.searchAliExpress(query, 10);
    
    console.log(`✅ ${products.length} produits trouvés sur AliExpress.`);

    let count = 0;
    for (const p of products) {
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
          supplier: 'AliExpress',
          supplierId: p.supplierId,
          isActive: true
        },
        update: {
          price: parseFloat(p.price),
          supplierPrice: parseFloat(p.supplierPrice),
          margin: margin,
          images: p.images || [p.imageUrl],
          sourceUrl: p.link || null,
          isActive: true
        }
      });
      count++;
      console.log(`📥 Importé: ${p.name}`);
    }

    console.log(`🎉 Succès : ${count} produits AliExpress importés/mis à jour.`);

  } catch (error) {
    console.error('❌ Erreur de sourcing:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runAliSourcing();
