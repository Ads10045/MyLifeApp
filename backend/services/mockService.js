/**
 * MockService - Fornece dados de fallback de alta qualidade quando as APIs estão offline/bloqueadas.
 * Isso garante que a UI nunca fique vazia (UX "Always Alive").
 */

const MOCK_DATA = {
    'Tech': [
        { name: 'iPhone 15 Pro Max - 256GB', price: 1199, supplierPrice: 950, supplier: 'Amazon', image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=400' },
        { name: 'Samsung Galaxy S24 Ultra', price: 1099, supplierPrice: 850, supplier: 'Amazon', image: 'https://images.unsplash.com/photo-1707248355202-09943fcf3611?w=400' },
        { name: 'AirPods Pro (2nd Gen)', price: 249, supplierPrice: 180, supplier: 'AliExpress', image: 'https://images.unsplash.com/photo-1588423770186-80f85631f67b?w=400' },
        { name: 'Sony WH-1000XM5 Headphones', price: 349, supplierPrice: 260, supplier: 'eBay', image: 'https://images.unsplash.com/photo-1618366712010-8c0e2978d252?w=400' }
    ],
    'Mode': [
        { name: 'Sneakers Nike Air Jordan 1', price: 180, supplierPrice: 120, supplier: 'eBay', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400' },
        { name: 'Veste en Cuir Premium', price: 150, supplierPrice: 90, supplier: 'AliExpress', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400' },
        { name: 'Sac à Main de Luxe', price: 450, supplierPrice: 300, supplier: 'Amazon', image: 'https://images.unsplash.com/photo-1584917769896-221c5843ad53?w=400' }
    ],
    'Cuisine': [
        { name: 'Machine à Café Espresso', price: 299, supplierPrice: 180, supplier: 'Amazon', image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400' },
        { name: 'Set de Couteaux Japonais', price: 120, supplierPrice: 70, supplier: 'AliExpress', image: 'https://images.unsplash.com/photo-1614362143003-99757f59d4e3?w=400' }
    ],
    'Beauté': [
        { name: 'Kit Maquillage Professionnel', price: 85, supplierPrice: 50, supplier: 'AliExpress', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400' },
        { name: 'Sérum Anti-Âge Premium', price: 65, supplierPrice: 35, supplier: 'Amazon', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400' }
    ]
};

const DEFAULT_ITEMS = [
    { name: 'Montre Intelligente Sport', price: 45, supplierPrice: 25, supplier: 'AliExpress', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
    { name: 'Écouteurs Bluetooth Pro', price: 35, supplierPrice: 15, supplier: 'AliExpress', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' }
];

class MockService {
    generateProducts(category, count = 5, specificSource = null) {
        console.log(`🎭 Génération de produits AI-Mock pour: ${category} (${specificSource || 'All'})`);
        
        let pool = MOCK_DATA[category] || DEFAULT_ITEMS;
        
        // Filter by source if requested
        if (specificSource) {
            pool = pool.filter(p => p.supplier === specificSource);
            if (pool.length === 0) pool = DEFAULT_ITEMS.map(p => ({ ...p, supplier: specificSource }));
        }

        return pool.slice(0, count).map((p, i) => ({
            name: p.name,
            description: `Produit tendance sélectionné par l'AI Agent (${category})`,
            price: p.price,
            supplierPrice: p.supplierPrice,
            imageUrl: p.image,
            images: [p.image],
            supplier: p.supplier,
            supplierId: `MOCK-${category}-${Date.now()}-${i}`,
            rating: 4.5,
            link: 'https://www.google.com'
        }));
    }
}

module.exports = new MockService();
