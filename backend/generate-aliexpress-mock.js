require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Realistic AliExpress product templates by category
const ALIEXPRESS_PRODUCTS = {
  'Tech': [
    { name: 'Wireless Bluetooth Earbuds Pro', price: 15.99, image: 'https://ae01.alicdn.com/kf/S8c9a0f5f5e4c4b8f8d9e1f2a3b4c5d6e.jpg' },
    { name: 'Smart Watch Fitness Tracker', price: 29.99, image: 'https://ae01.alicdn.com/kf/S1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6.jpg' },
    { name: 'USB-C Fast Charging Cable 3-Pack', price: 8.99, image: 'https://ae01.alicdn.com/kf/Sabc123def456ghi789jkl012mno345p.jpg' },
    { name: 'Portable Power Bank 20000mAh', price: 19.99, image: 'https://ae01.alicdn.com/kf/Sx1y2z3a4b5c6d7e8f9g0h1i2j3k4l5.jpg' },
    { name: 'LED Ring Light for Streaming', price: 24.99, image: 'https://ae01.alicdn.com/kf/Sm5n6o7p8q9r0s1t2u3v4w5x6y7z8a9.jpg' },
    { name: 'Wireless Ergonomic Vertical Mouse', price: 12.50, image: 'https://ae01.alicdn.com/kf/H0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5.jpg' },
    { name: 'Digital Alarm Clock with Wireless Charging', price: 21.00, image: 'https://ae01.alicdn.com/kf/H6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1.jpg' },
    { name: 'Bluetooth Selfie Stick Tripod', price: 11.20, image: 'https://ae01.alicdn.com/kf/He2f3g4h5i6j7k8l9m0n1o2p3q4r5s6.jpg' },
  ],
  'Mode': [
    { name: 'Women Summer Casual Dress', price: 18.99, image: 'https://ae01.alicdn.com/kf/Sf1g2h3i4j5k6l7m8n9o0p1q2r3s4t5.jpg' },
    { name: 'Men Slim Fit Casual Shirt', price: 14.99, image: 'https://ae01.alicdn.com/kf/Su6v7w8x9y0z1a2b3c4d5e6f7g8h9i0.jpg' },
    { name: 'Trendy Crossbody Bag for Women', price: 12.99, image: 'https://ae01.alicdn.com/kf/Sj1k2l3m4n5o6p7q8r9s0t1u2v3w4x5.jpg' },
    { name: 'Unisex Snapback Baseball Cap', price: 7.99, image: 'https://ae01.alicdn.com/kf/Sy6z7a8b9c0d1e2f3g4h5i6j7k8l9m0.jpg' },
    { name: 'Fashion Sunglasses UV400', price: 9.99, image: 'https://ae01.alicdn.com/kf/Sn1o2p3q4r5s6t7u8v9w0x1y2z3a4b5.jpg' },
    { name: 'Mens Lightweight Athletic Joggers', price: 16.50, image: 'https://ae01.alicdn.com/kf/Ht2u3v4w5x6y7z8a9b0c1d2e3f4g5h6.jpg' },
    { name: 'Womens Oversized Knit Sweater', price: 23.90, image: 'https://ae01.alicdn.com/kf/Hi7j8k9l0m1n2o3p4q5r6s7t8u9v0w1.jpg' },
    { name: 'Leather Slim Wallet for Men', price: 10.99, image: 'https://ae01.alicdn.com/kf/Hx2y3z4a5b6c7d8e9f0g1h2i3j4k5l6.jpg' },
  ],
  'Maison': [
    { name: 'Wall Mounted Floating Shelves Set', price: 22.99, image: 'https://ae01.alicdn.com/kf/Sc6d7e8f9g0h1i2j3k4l5m6n7o8p9q0.jpg' },
    { name: 'LED Strip Lights RGB 5M', price: 16.99, image: 'https://ae01.alicdn.com/kf/Sr1s2t3u4v5w6x7y8z9a0b1c2d3e4f5.jpg' },
    { name: 'Kitchen Knife Set 8-Piece', price: 25.99, image: 'https://ae01.alicdn.com/kf/Sg6h7i8j9k0l1m2n3o4p5q6r7s8t9u0.jpg' },
    { name: 'Memory Foam Pillow 2-Pack', price: 19.99, image: 'https://ae01.alicdn.com/kf/Sv1w2x3y4z5a6b7c8d9e0f1g2h3i4j5.jpg' },
    { name: 'Decorative Canvas Wall Art', price: 14.99, image: 'https://ae01.alicdn.com/kf/Sk6l7m8n9o0p1q2r3s4t5u6v7w8x9y0.jpg' },
    { name: 'Automatic Soap Dispenser Touchless', price: 17.50, image: 'https://ae01.alicdn.com/kf/Hm7n8o9p0q1r2s3t4u5v6w7x8y9z0a1.jpg' },
    { name: 'Bamboo Wood Cutting Board', price: 13.20, image: 'https://ae01.alicdn.com/kf/Hb2c3d4e5f6g7h8i9j0k1l2m3n4o5p6.jpg' },
    { name: 'Ceramic Essential Oil Burner', price: 12.00, image: 'https://ae01.alicdn.com/kf/Hq7r8s9t0u1v2w3x4y5z6a7b8c9d0e1.jpg' },
  ],
  'Sport': [
    { name: 'Yoga Mat Non-Slip Exercise Mat', price: 13.99, image: 'https://ae01.alicdn.com/kf/Sz1a2b3c4d5e6f7g8h9i0j1k2l3m4n5.jpg' },
    { name: 'Resistance Bands Set of 5', price: 11.99, image: 'https://ae01.alicdn.com/kf/So6p7q8r9s0t1u2v3w4x5y6z7a8b9c0.jpg' },
    { name: 'Jump Rope Speed Rope for Fitness', price: 8.99, image: 'https://ae01.alicdn.com/kf/Sd1e2f3g4h5i6j7k8l9m0n1o2p3q4r5.jpg' },
    { name: 'Gym Gloves Weight Lifting', price: 12.99, image: 'https://ae01.alicdn.com/kf/Ss6t7u8v9w0x1y2z3a4b5c6d7e8f9g0.jpg' },
    { name: 'Water Bottle 1L Sports Bottle', price: 9.99, image: 'https://ae01.alicdn.com/kf/Sh1i2j3k4l5m6n7o8p9q0r1s2t3u4v5.jpg' },
    { name: 'Adjustable Ankle Weights (Pair)', price: 14.50, image: 'https://ae01.alicdn.com/kf/Hf2g3h4i5j6k7l8m9n0o1p2q3r4s5t6.jpg' },
    { name: 'Hand Grip Strengthener Kit', price: 10.00, image: 'https://ae01.alicdn.com/kf/Hu7v8w9x0y1z2a3b4c5d6e7f8g9h0i1.jpg' },
    { name: 'Running Armband Phone Holder', price: 7.50, image: 'https://ae01.alicdn.com/kf/Hj2k3l4m5n6o7p8q9r0s1t2u3v4w5x6.jpg' },
  ],
  'Beauté': [
    { name: 'Face Mask Sheet 10-Pack', price: 11.99, image: 'https://ae01.alicdn.com/kf/Sw6x7y8z9a0b1c2d3e4f5g6h7i8j9k0.jpg' },
    { name: 'Makeup Brush Set 12 Pieces', price: 15.99, image: 'https://ae01.alicdn.com/kf/Sl1m2n3o4p5q6r7s8t9u0v1w2x3y4z5.jpg' },
    { name: 'Hair Curler Automatic Curling Iron', price: 24.99, image: 'https://ae01.alicdn.com/kf/Sa6b7c8d9e0f1g2h3i4j5k6l7m8n9o0.jpg' },
    { name: 'Nail Art Kit with UV Lamp', price: 32.99, image: 'https://ae01.alicdn.com/kf/Sp1q2r3s4t5u6v7w8x9y0z1a2b3c4d5.jpg' },
    { name: 'Essential Oil Diffuser Humidifier', price: 18.99, image: 'https://ae01.alicdn.com/kf/Se6f7g8h9i0j1k2l3m4n5o6p7q8r9s0.jpg' },
    { name: 'Electric Sonic Facial Brush', price: 19.99, image: 'https://ae01.alicdn.com/kf/Hk2l3m4n5o6p7q8r9s0t1u2v3w4x5y6.jpg' },
    { name: 'LED Therapy Skin Care Mask', price: 45.00, image: 'https://ae01.alicdn.com/kf/Hz7a8b9c0d1e2f3g4h5i6j7k8l9m0n1.jpg' },
    { name: 'Natural Jade Roller & Gua Sha Set', price: 11.50, image: 'https://ae01.alicdn.com/kf/Ho2p3q4r5s6t7u8v9w0x1y2z3a4b5c6.jpg' },
  ],
  'Cuisine': [
    { name: 'Silicone Baking Mat Non-Stick', price: 9.99, image: 'https://ae01.alicdn.com/kf/St1u2v3w4x5y6z7a8b9c0d1e2f3g4h5.jpg' },
    { name: 'Multi-Function Vegetable Slicer', price: 13.99, image: 'https://ae01.alicdn.com/kf/Si6j7k8l9m0n1o2p3q4r5s6t7u8v9w0.jpg' },
    { name: 'Stainless Steel Mixing Bowls Set', price: 16.99, image: 'https://ae01.alicdn.com/kf/Sx1y2z3a4b5c6d7e8f9g0h1i2j3k4l5.jpg' },
    { name: 'Digital Kitchen Scale Food Scale', price: 12.99, image: 'https://ae01.alicdn.com/kf/Sm6n7o8p9q0r1s2t3u4v5w6x7y8z9a0.jpg' },
    { name: 'Air Fryer Silicone Pot Liner', price: 10.99, image: 'https://ae01.alicdn.com/kf/Sb1c2d3e4f5g6h7i8j9k0l1m2n3o4p5.jpg' },
    { name: 'Rechargeable Milk Frother Handheld', price: 9.50, image: 'https://ae01.alicdn.com/kf/Hd2e3f4g5h6i7j8k9l0m1n2o3p4q5r6.jpg' },
    { name: 'Bag Sealer Mini Heat Sealer', price: 6.99, image: 'https://ae01.alicdn.com/kf/Hu7v8w9x0y1z2a3b4c5d6e7f8g9h0i1.jpg' },
    { name: 'Adjustable Measuring Spoon', price: 5.50, image: 'https://ae01.alicdn.com/kf/Hj2k3l4m5n6o7p8q9r0s1t2u3v4w5x6.jpg' },
  ],
  'Bébé': [
    { name: 'Cloud Night Light for Nursery', price: 12.99, image: 'https://ae01.alicdn.com/kf/Hk2l3m4n5o6p7q8r9s0t1u2v3w4x5y6.jpg' },
    { name: 'Silicone Baby Teether Toy', price: 6.50, image: 'https://ae01.alicdn.com/kf/Hz7a8b9c0d1e2f3g4h5i6j7k8l9m0n1.jpg' },
  ]
};

async function generateAliExpressProducts() {
  console.log('🚀 Génération de 50 produits AliExpress réalistes...\n');
  
  let totalImported = 0;
  const categories = Object.keys(ALIEXPRESS_PRODUCTS);

  for (const category of categories) {
    console.log(`📂 Catégorie: ${category}`);
    const products = ALIEXPRESS_PRODUCTS[category];
    
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const itemId = Math.floor(Math.random() * 1000000000) + 1000000000;
      const supplierPrice = p.price;
      const sellingPrice = parseFloat((supplierPrice * 1.3).toFixed(2));
      const margin = ((sellingPrice - supplierPrice) / sellingPrice) * 100;
      
      try {
        await prisma.product.upsert({
          where: { supplierId: `AE-MOCK-${itemId}` },
          create: {
            id: crypto.randomUUID(),
            name: p.name,
            description: `${p.name} - High quality product from AliExpress with fast shipping`,
            price: sellingPrice,
            supplierPrice: supplierPrice,
            margin: margin,
            imageUrl: p.image,
            images: [p.image],
            sourceUrl: `https://www.aliexpress.com/item/${itemId}.html`,
            category: category,
            supplier: 'AliExpress',
            supplierId: `AE-MOCK-${itemId}`,
            isActive: true,
            updatedAt: new Date()
          },
          update: {
            price: sellingPrice,
            supplierPrice: supplierPrice,
            margin: margin,
            isActive: true,
            updatedAt: new Date()
          }
        });
        
        totalImported++;
        console.log(`   ✅ ${totalImported}. ${p.name} - ${sellingPrice}€`);
      } catch (err) {
        console.error(`   ❌ Erreur: ${err.message}`);
      }
    }
    console.log('');
  }

  console.log(`\n🎉 Import terminé ! ${totalImported} produits AliExpress ajoutés.`);
  await prisma.$disconnect();
}

generateAliExpressProducts();
