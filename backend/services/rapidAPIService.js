const axios = require('axios');

// RapidAPI Configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST_AMAZON = 'real-time-amazon-data.p.rapidapi.com';
const RAPIDAPI_HOST_ALIEXPRESS = 'aliexpress-datahub.p.rapidapi.com';
const RAPIDAPI_HOST_EBAY = 'ebay-data-api.p.rapidapi.com';

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

    const host = 'aliexpress-datahub.p.rapidapi.com';
    console.log(`🔍 Recherche AliExpress via RapidAPI (${host}): "${query}"...`);
    
    try {
      const response = await axios.get(`https://${host}/item_search`, {
        params: {
            q: query,
            page: '1'
        },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': host
        },
        timeout: 15000
      });

      const products = response.data?.result?.resultList || [];
      console.log(`✅ ${products.length} produits AliExpress trouvés`);

      if (products.length === 0) {
          console.log('⚠️ Aucun produit trouvé sur AliExpress (DataHub)');
          return [];
      }

      return products.slice(0, limit).map((p, i) => {
        const item = p.item || p;
        const name = item.title || item.product_title || 'Produit AliExpress';
        const itemId = item.itemId || item.item_id || p.productId || p.product_id;
        
        let mainImage = item.image || item.product_main_image || 'https://via.placeholder.com/400';
        if (typeof mainImage === 'string' && mainImage.startsWith('//')) {
            mainImage = 'https:' + mainImage;
        }
        
        const rawImages = item.images || item.product_small_images || [mainImage];
        const sanitizedImages = Array.isArray(rawImages) ? rawImages.map(img => {
            if (typeof img === 'string' && img.startsWith('//')) return 'https:' + img;
            return img;
        }) : [mainImage];
        
        let sPrice = parseFloat(item.sku?.def?.promotionPrice || item.sku?.def?.price || item.app_sale_price || 15);
        if (isNaN(sPrice)) sPrice = 15.0;
        
        const supplierPrice = parseFloat(sPrice.toFixed(2));
        const sellingPrice = parseFloat((supplierPrice * 1.5).toFixed(2)); // RG: +50%

        let baseUrl = item.itemUrl || item.item_url || item.product_detail_url || `https://www.aliexpress.com/item/${itemId}.html`;
        if (baseUrl.startsWith('//')) baseUrl = 'https:' + baseUrl;

        return {
          name: name.substring(0, 80),
          description: name,
          price: sellingPrice,
          supplierPrice: supplierPrice,
          imageUrl: mainImage,
          images: sanitizedImages,
          supplier: 'AliExpress',
          supplierId: `AE-${itemId}`,
          rating: parseFloat(item.rating || item.evaluate_rate) || 4.5,
          link: baseUrl,
          isDeal: true
        };
      });

    } catch (error) {
      console.error('❌ Erreur AliExpress RapidAPI:', error.response?.data?.message || error.message);
      return [];
    }
  }
 
  // Search eBay products
  async searchEbay(query, limit = 5) {
    if (!RAPIDAPI_KEY) {
      console.log('⚠️ Pas de clé RapidAPI configurée');
      return [];
    }

    console.log(`🔍 Recherche eBay via RapidAPI: "${query}"`);
    
    try {
      const response = await axios.get('https://ebay-data-api.p.rapidapi.com/search', {
        params: {
          query: query,
          page: '1',
          perPage: limit.toString()
        },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST_EBAY
        },
        timeout: 15000
      });

      const products = response.data?.items || response.data?.data?.items || [];
      console.log(`✅ ${products.length} produits eBay trouvés`);

      return products.slice(0, limit).map((p, i) => {
        const priceValue = parseFloat(p.price?.value || p.price || 15);
        const supplierPrice = parseFloat(priceValue.toFixed(2));
        const sellingPrice = parseFloat((supplierPrice * 1.3).toFixed(2)); // 30% margin
        
        return {
          name: p.title?.substring(0, 80) || 'Produit eBay',
          description: p.title || 'Produit eBay tendance',
          price: sellingPrice,
          supplierPrice: supplierPrice,
          imageUrl: p.image || p.imageUrl || 'https://via.placeholder.com/400',
          images: p.images || [p.image || p.imageUrl || 'https://via.placeholder.com/400'],
          supplier: 'eBay',
          supplierId: `EBAY-${p.id || p.itemId || Date.now()}-${i}`,
          rating: 4.2, // Default rating if not provided
          link: p.itemUrl || p.url
        };
      });

    } catch (error) {
      console.error('❌ Erreur eBay RapidAPI:', error.message);
      return [];
    }
  }

  // Combined search
  async searchAll(query, limit = 5) {
    console.log(`🌐 Recherche multi-plateforme RapidAPI: "${query}"`);
    
    const [amazonProducts, aliexpressProducts, ebayProducts] = await Promise.all([
      this.searchAmazon(query, limit),
      this.searchAliExpress(query, limit),
      this.searchEbay(query, limit)
    ]);

    const allProducts = [...amazonProducts, ...aliexpressProducts, ...ebayProducts];
    
    // Shuffle and return
    return allProducts.sort(() => Math.random() - 0.5).slice(0, limit * 3);
  }
}

module.exports = new RapidAPIService();
