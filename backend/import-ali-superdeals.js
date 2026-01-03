require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function importSuperDeals() {
    console.log('📡 Fetching SuperDeals from AliExpress DataHub...');
    try {
        const res = await axios.get('https://aliexpress-datahub.p.rapidapi.com/item_search', {
            // No 'q' parameter, just default deals
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'aliexpress-datahub.p.rapidapi.com'
            },
            timeout: 15000
        });

        // The structure might be res.data.result.resultList
        const products = res.data?.result?.resultList || [];
        console.log(`✅ Found ${products.length} potential products.`);

        let count = 0;
        for (const p of products) {
            const item = p.item || p;
            const name = item.title || 'Produit AliExpress';
            const itemId = item.itemId || item.item_id || Date.now();
            
            // Handle image logic
            let mainImage = item.image || (item.sku && item.sku.def && item.sku.def.image) || 'https://via.placeholder.com/400';
            if (mainImage.startsWith('//')) mainImage = 'https:' + mainImage;
            
            const rawImages = item.images || [mainImage];
            const sanitizedImages = rawImages.map(img => img.startsWith('//') ? 'https:' + img : img);

            let sPrice = parseFloat(item.sku?.def?.promotionPrice || item.sku?.def?.price || 15);
            if (isNaN(sPrice)) sPrice = 15.0;
            
            const supplierPrice = parseFloat(sPrice.toFixed(2));
            const sellingPrice = parseFloat((supplierPrice * 1.3).toFixed(2)); 
            const margin = ((sellingPrice - supplierPrice) / sellingPrice) * 100;

            await prisma.product.upsert({
                where: { supplierId: `AE-${itemId}` },
                create: {
                    id: crypto.randomUUID(),
                    name: name.substring(0, 80),
                    description: name,
                    price: sellingPrice,
                    supplierPrice: supplierPrice,
                    margin: margin,
                    imageUrl: mainImage,
                    images: sanitizedImages,
                    sourceUrl: item.itemUrl || item.item_url || `https://www.aliexpress.com/item/${itemId}.html`,
                    category: 'Tech', // Default to Tech for now
                    supplier: 'AliExpress',
                    supplierId: `AE-${itemId}`,
                    isActive: true,
                    updatedAt: new Date()
                },
                update: {
                    price: sellingPrice,
                    supplierPrice: supplierPrice,
                    margin: margin,
                    updatedAt: new Date()
                }
            });
            count++;
            console.log(`   ✅ [${count}] ${name}`);
            if (count >= 50) break;
        }

        console.log(`\n🎉 Import completed: ${count} real AliExpress products added.`);
    } catch (e) {
        console.log('❌ Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

importSuperDeals();
