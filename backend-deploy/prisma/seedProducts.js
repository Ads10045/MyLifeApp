const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = ['Tech', 'Cuisine', 'Mode', 'Sport', 'Maison', 'Beauté', 'Bébé', 'Animaux'];

const products = [
  // TECH - 10 products
  {
    name: "Écouteurs Bluetooth Pro",
    description: "Écouteurs sans fil haute qualité avec réduction de bruit active. Autonomie 24h. Compatible iOS et Android.",
    price: 49.90,
    supplierPrice: 15.00,
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500",
    category: "Tech",
    supplier: "AliExpress",
    supplierId: "ALI-TECH-001"
  },
  {
    name: "Montre Connectée Sport V3",
    description: "Suivi cardiaque, GPS, notifications, étanche 50m. Design élégant et écran AMOLED.",
    price: 69.90,
    supplierPrice: 22.00,
    imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500",
    category: "Tech",
    supplier: "AliExpress",
    supplierId: "ALI-TECH-002"
  },
  {
    name: "Chargeur Sans Fil 3-en-1",
    description: "Chargez simultanément votre téléphone, montre et écouteurs. Station pliante et compacte.",
    price: 34.90,
    supplierPrice: 10.00,
    imageUrl: "https://images.unsplash.com/photo-1622445275576-721325763afe?w=500",
    category: "Tech",
    supplier: "AliExpress",
    supplierId: "ALI-TECH-003"
  },
  {
    name: "Mini Projecteur HD Portable",
    description: "Cinéma à la maison. 1080p supporté, connexion HDMI/USB/Wifi. Idéal pour soirées films.",
    price: 89.90,
    supplierPrice: 35.00,
    imageUrl: "https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?w=500",
    category: "Tech",
    supplier: "AliExpress",
    supplierId: "ALI-TECH-004"
  },
  {
    name: "Support Téléphone Voiture Magnétique",
    description: "Rotation 360°, fixation ultra-puissante. Compatible avec tous les types de grilles d'aération.",
    price: 14.90,
    supplierPrice: 3.00,
    imageUrl: "https://images.unsplash.com/photo-1533025625781-805178129fb4?w=500",
    category: "Tech",
    supplier: "AliExpress",
    supplierId: "ALI-TECH-005"
  },
  {
    name: "Anneau Lumière LED Selfie",
    description: "Éclairez vos vlogs et selfies. 3 modes de lumière, trépied inclus. Alimentation USB.",
    price: 24.90,
    supplierPrice: 6.00,
    imageUrl: "https://images.unsplash.com/photo-1621768216002-e2983713491a?w=500",
    category: "Tech",
    supplier: "AliExpress",
    supplierId: "ALI-TECH-006"
  },
  {
    name: "Batterie Externe Solaire 20000mAh",
    description: "Chargeur robuste pour l'extérieur. Résistant à l'eau et aux chocs. Lampe torche intégrée.",
    price: 39.90,
    supplierPrice: 12.00,
    imageUrl: "https://images.unsplash.com/photo-1620173693247-49f3e4210fd8?w=500",
    category: "Tech",
    supplier: "AliExpress",
    supplierId: "ALI-TECH-007"
  },
  {
    name: "Clavier Mécanique RGB",
    description: "Switches bleus, rétroéclairage personnalisable. Compact et ergonomique pour le bureau ou le gaming.",
    price: 49.90,
    supplierPrice: 18.00,
    imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500",
    category: "Tech",
    supplier: "AliExpress",
    supplierId: "ALI-TECH-008"
  },
  
  // CUISINE - 8 products
  {
    name: "Hachoir Multifonction Manuel",
    description: "Hachez légumes, noix et herbes en quelques secondes. Facile à nettoyer.",
    price: 19.90,
    supplierPrice: 5.00,
    imageUrl: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=500",
    category: "Cuisine",
    supplier: "AliExpress",
    supplierId: "ALI-KITCH-001"
  },
  {
    name: "Balance de Cuisine Connectée",
    description: "Précision au gramme près. Application dédiée pour le suivi nutritionnel.",
    price: 29.90,
    supplierPrice: 9.00,
    imageUrl: "https://images.unsplash.com/photo-1522401421628-e5e3a2bd28fc?w=500",
    category: "Cuisine",
    supplier: "AliExpress",
    supplierId: "ALI-KITCH-002"
  },
  {
    name: "Blender Portable USB",
    description: "Faites vos smoothies n'importe où. Rechargeable, lames en acier inoxydable.",
    price: 24.90,
    supplierPrice: 8.00,
    imageUrl: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500",
    category: "Cuisine",
    supplier: "AliExpress",
    supplierId: "ALI-KITCH-003"
  },
  {
    name: "Set Couteaux Céramique",
    description: "Lot de 3 couteaux ultra-tranchants avec éplucheur. Manches ergonomiques antidérapants.",
    price: 34.90,
    supplierPrice: 11.00,
    imageUrl: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=500",
    category: "Cuisine",
    supplier: "AliExpress",
    supplierId: "ALI-KITCH-004"
  },
  {
    name: "Lunch Box Chauffante Électrique",
    description: "Réchauffez votre repas au bureau ou en voiture. Prise secteur et allume-cigare inclus.",
    price: 29.90,
    supplierPrice: 10.00,
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500",
    category: "Cuisine",
    supplier: "AliExpress",
    supplierId: "ALI-KITCH-005"
  },
  
  // MODE - 8 products
  {
    name: "Sac à Dos Antivol USB",
    description: "Design sécurisé, port de charge USB, imperméable. Idéal pour les trajets quotidiens.",
    price: 45.90,
    supplierPrice: 16.00,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    category: "Mode",
    supplier: "AliExpress",
    supplierId: "ALI-MODE-001"
  },
  {
    name: "Lunettes de Soleil Polarisées",
    description: "Protection UV400, monture légère et résistante. Style intemporel.",
    price: 24.90,
    supplierPrice: 4.00,
    imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
    category: "Mode",
    supplier: "AliExpress",
    supplierId: "ALI-MODE-002"
  },
  {
    name: "Portefeuille Minimaliste RFID",
    description: "Protection contre le vol de données. Cuir véritable, fin et élégant. Peut contenir 8 cartes.",
    price: 19.90,
    supplierPrice: 5.00,
    imageUrl: "https://plus.unsplash.com/premium_photo-1673322676645-ec7908b8b0e8?w=500",
    category: "Mode",
    supplier: "AliExpress",
    supplierId: "ALI-MODE-003"
  },
  {
    name: "Montre Homme Quartz Luxe",
    description: "Bracelet acier, chronographe fonctionnel, étanche. Un style premium à petit prix.",
    price: 39.90,
    supplierPrice: 12.00,
    imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500",
    category: "Mode",
    supplier: "AliExpress",
    supplierId: "ALI-MODE-004"
  },
  
  // SPORT - 8 products
  {
    name: "Kit Bandes Élastiques Fitness",
    description: "5 niveaux de résistance. Salle de sport complète dans un sac. Guide d'exercices inclus.",
    price: 22.90,
    supplierPrice: 6.00,
    imageUrl: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500",
    category: "Sport",
    supplier: "AliExpress",
    supplierId: "ALI-SPORT-001"
  },
  {
    name: "Correcteur de Posture",
    description: "Soulage les douleurs dorsales. Discret sous les vêtements, réglable et confortable.",
    price: 19.90,
    supplierPrice: 5.00,
    imageUrl: "https://plus.unsplash.com/premium_photo-1664109999537-088e7d964da2?w=500",
    category: "Sport",
    supplier: "AliExpress",
    supplierId: "ALI-SPORT-002"
  },
  {
    name: "Tapis de Yoga Antidérapant",
    description: "Épaisseur 6mm, TPE écologique. Surface texturée pour une adhérence optimale.",
    price: 29.90,
    supplierPrice: 10.00,
    imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500",
    category: "Sport",
    supplier: "AliExpress",
    supplierId: "ALI-SPORT-003"
  },
  {
    name: "Gourde Sport Isotherme 1L",
    description: "Maintient le froid 24h. Acier inoxydable double paroi. Bouchon anti-fuite.",
    price: 24.90,
    supplierPrice: 8.00,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500",
    category: "Sport",
    supplier: "AliExpress",
    supplierId: "ALI-SPORT-004"
  },
  
  // MAISON & DECO - 8 products
  {
    name: "Ruban LED RGB 5M",
    description: "Contrôle via application smartphone. Sync avec la musique. Autocollant puissant.",
    price: 19.90,
    supplierPrice: 5.00,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500",
    category: "Maison",
    supplier: "AliExpress",
    supplierId: "ALI-HOME-001"
  },
  {
    name: "Diffuseur Huiles Essentielles",
    description: "Effet flamme réaliste. Humidificateur silencieux pour une ambiance relaxante.",
    price: 34.90,
    supplierPrice: 11.00,
    imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500",
    category: "Maison",
    supplier: "AliExpress",
    supplierId: "ALI-HOME-002"
  },
  {
    name: "Projecteur Galaxie",
    description: "Transformez votre plafond en ciel étoilé. Idéal pour dormir ou faire la fête.",
    price: 29.90,
    supplierPrice: 9.00,
    imageUrl: "https://images.unsplash.com/photo-1534063715264-fd433bc6572a?w=500",
    category: "Maison",
    supplier: "AliExpress",
    supplierId: "ALI-HOME-003"
  },
  
  // BEAUTE - 6 products
  {
    name: "Brosse Nettoyante Visage",
    description: "Silicone doux, vibrations soniques. Nettoyage en profondeur et massage anti-âge.",
    price: 19.90,
    supplierPrice: 4.00,
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500",
    category: "Beauté",
    supplier: "AliExpress",
    supplierId: "ALI-BEAUTY-001"
  },
  {
    name: "Miroir LED Maquillage",
    description: "Éclairage ajustable, grossissement x5. Rechargeable USB.",
    price: 24.90,
    supplierPrice: 7.00,
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdd403cc2?w=500",
    category: "Beauté",
    supplier: "AliExpress",
    supplierId: "ALI-BEAUTY-002"
  },
  {
    name: "Épilateur Lumière Pulsée",
    description: "Épilation définitive à domicile. 990 000 flashs. Indolore et efficace.",
    price: 59.90,
    supplierPrice: 20.00,
    imageUrl: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=500",
    category: "Beauté",
    supplier: "AliExpress",
    supplierId: "ALI-BEAUTY-003"
  }
];

async function seedProducts() {
  console.log('🌱 Ajout de nombreux produits réels au catalogue...');
  
  let count = 0;
  
  for (const product of products) {
    const margin = ((product.price - product.supplierPrice) / product.price) * 100;
    
    // Simuler différentes dates de création pour le tri
    const randomDays = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - randomDays);
    
    await prisma.product.upsert({
      where: { supplierId: product.supplierId },
      update: { ...product, margin }, // Mettre à jour si existe
      create: { 
        ...product, 
        margin,
        createdAt: date
      }
    });
    count++;
  }
  
  // Dupliquer certains produits pour avoir de la pagination (masse)
  // En changeant légèrement les noms et IDs
  for (let i = 0; i < 20; i++) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const newId = `${randomProduct.supplierId}-V${i}`;
    
    await prisma.product.upsert({
      where: { supplierId: newId },
      update: {},
      create: {
        ...randomProduct,
        name: `${randomProduct.name} V${i+1}`,
        supplierId: newId,
        margin: ((randomProduct.price - randomProduct.supplierPrice) / randomProduct.price) * 100,
        createdAt: new Date(new Date().getTime() - Math.random() * 10000000000)
      }
    });
    count++;
  }
  
  const total = await prisma.product.count();
  console.log(`\n📦 ${count} produits traités.`);
  console.log(`📦 Total en base: ${total} produits.`);
  console.log('🎉 Seed terminé!');
}

seedProducts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
