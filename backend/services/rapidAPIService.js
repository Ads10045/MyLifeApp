const axios = require('axios');

// RapidAPI Configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST_AMAZON = 'real-time-amazon-data.p.rapidapi.com';
const RAPIDAPI_HOST_ALIEXPRESS = 'aliexpress-datahub.p.rapidapi.com';

class RapidAPIService {
  
  // Search Amazon products
  async searchAmazon(query, limit = 5) {
    if (!RAPIDAPI_KEY) {
      console.log('⚠️ Pas de clé RapidAPI configurée');
      return [];
    }

    // Add 'deals' to query if not present to find promotions
    const searchQuery = query.toLowerCase().includes('deal') ? query : `${query} deals`;
    console.log(`🔍 Recherche Amazon Deals via RapidAPI: "${searchQuery}"`);
    
    try {
      const response = await axios.get('https://real-time-amazon-data.p.rapidapi.com/search', {
        params: {
          query: searchQuery,
          page: '1',
          country: 'FR',
          category_id: 'aps',
          sort_by: 'RELEVANCE' // Can also use PRICE_LOW_TO_HIGH but RELEVANCE with 'deals' keyword is usually better for actual promos
        },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST_AMAZON
        },
        timeout: 15000
      });

      const products = response.data?.data?.products || [];
      console.log(`✅ ${products.length} produits Amazon trouvés`);

      return products.slice(0, limit).map((p, i) => {
        // Parse price - handle different formats
        let rawPrice = parseFloat(p.product_price?.replace(/[^0-9.,]/g, '').replace(',', '.') || 25);
        // If price is too high (probably in MAD or centimes), divide accordingly
        if (rawPrice > 1000) rawPrice = rawPrice / 100;
        if (rawPrice > 500) rawPrice = rawPrice / 10;
        
        const supplierPrice = parseFloat(rawPrice.toFixed(2));
        // Simulate a "List Price" that is higher to show discount
        const sellingPrice = parseFloat((supplierPrice * 1.2).toFixed(2)); // 20% margin
        
        // Extract all product images
        const allImages = p.product_photos || [];
        const mainImage = p.product_photo || allImages[0] || 'https://via.placeholder.com/400';
        
        return {
          name: p.product_title?.substring(0, 80) || 'Produit Amazon',
          description: p.product_title || 'Produit Amazon de qualité',
          price: sellingPrice,
          supplierPrice: supplierPrice,
          imageUrl: mainImage,
          images: allImages.length > 0 ? allImages : [mainImage], // Ensure at least 1 image
          supplier: 'Amazon',
          supplierId: `AMZ-${p.asin || Date.now()}-${i}`,
          rating: parseFloat(p.product_star_rating) || 4.0,
          reviews: p.product_num_ratings || 0,
          link: p.product_url, // Ensure link is passed
          isDeal: true // Mark as deal
        };
      });

    } catch (error) {
      console.error('❌ Erreur Amazon RapidAPI:', error.message);
      return [];
    }
  }

  // Search AliExpress products
  async searchAliExpress(query, limit = 5) {
    if (!RAPIDAPI_KEY) {
      console.log('⚠️ Pas de clé RapidAPI configurée');
      return [];
    }

    console.log(`🔍 Recherche AliExpress via RapidAPI: "${query}"`);
    
    try {
      const response = await axios.get('https://aliexpress-datahub.p.rapidapi.com/item_search', {
        params: {
          q: query,
          page: '1'
        },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST_ALIEXPRESS
        },
        timeout: 15000
      });

      const products = response.data?.result?.resultList || [];
      console.log(`✅ ${products.length} produits AliExpress trouvés`);

      return products.slice(0, limit).map((p, i) => {
        const item = p.item || p;
        const mainImage = item.image || 'https://via.placeholder.com/400';
        // AliExpress sometimes has multiple images in different fields
        const allImages = item.images || [mainImage];
        
        return {
          name: item.title?.substring(0, 80) || 'Produit AliExpress',
          description: item.title || 'Produit tendance AliExpress',
          price: parseFloat(item.sku?.def?.promotionPrice || item.sku?.def?.price || 15) * 1.3,
          supplierPrice: parseFloat(item.sku?.def?.promotionPrice || item.sku?.def?.price || 12),
          imageUrl: mainImage,
          images: allImages,
          supplier: 'AliExpress',
          supplierId: `AE-${item.itemId || Date.now()}-${i}`,
          rating: parseFloat(item.averageStar) || 4.5,
          orders: item.orders || 0
        };
      });

    } catch (error) {
      console.error('❌ Erreur AliExpress RapidAPI:', error.message);
      return [];
    }
  }

  // Combined search
  async searchAll(query, limit = 5) {
    console.log(`🌐 Recherche multi-plateforme RapidAPI: "${query}"`);
    
    const [amazonProducts, aliexpressProducts] = await Promise.all([
      this.searchAmazon(query, limit),
      this.searchAliExpress(query, limit)
    ]);

    const allProducts = [...amazonProducts, ...aliexpressProducts];
    
    // Shuffle and return
    return allProducts.sort(() => Math.random() - 0.5).slice(0, limit * 2);
  }
}

module.exports = new RapidAPIService();
