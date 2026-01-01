const axios = require('axios');
const cheerio = require('cheerio');

// User-Agent pour simuler un navigateur
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

class ProductScraper {
  
  // Recherche sur AliExpress via leur API mobile
  async searchAliExpress(query, limit = 10) {
    console.log(`🔍 Recherche AliExpress: "${query}"`);
    
    try {
      // Utiliser l'API de recherche publique d'AliExpress
      const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}&page=1`;
      
      const response = await axios.get(searchUrl, { 
        headers: HEADERS,
        timeout: 10000 
      });
      
      const $ = cheerio.load(response.data);
      const products = [];
      
      // Extraire les données des produits (structure peut changer)
      $('[class*="product-card"]').each((index, element) => {
        if (index >= limit) return false;
        
        const $el = $(element);
        const title = $el.find('[class*="title"]').text().trim() || 
                      $el.find('a').first().text().trim();
        const priceText = $el.find('[class*="price"]').first().text();
        const image = $el.find('img').first().attr('src') || 
                      $el.find('img').first().attr('data-src');
        const link = $el.find('a').first().attr('href');
        
        if (title && priceText) {
          const price = this.extractPrice(priceText);
          products.push({
            name: title.substring(0, 80),
            description: `Produit AliExpress - ${title.substring(0, 100)}`,
            price: price * 1.5, // Marge 50%
            supplierPrice: price,
            imageUrl: image?.startsWith('//') ? `https:${image}` : image,
            supplier: 'AliExpress',
            supplierId: `AE-${Date.now()}-${index}`,
            link: link?.startsWith('//') ? `https:${link}` : link
          });
        }
      });
      
      console.log(`✅ ${products.length} produits trouvés sur AliExpress`);
      return products;
      
    } catch (error) {
      console.error('❌ Erreur AliExpress:', error.message);
      return [];
    }
  }

  // Alternative: Scraper Amazon
  async searchAmazon(query, limit = 10) {
    console.log(`🔍 Recherche Amazon: "${query}"`);
    
    try {
      const searchUrl = `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, { 
        headers: HEADERS,
        timeout: 10000 
      });
      
      const $ = cheerio.load(response.data);
      const products = [];
      
      $('[data-component-type="s-search-result"]').each((index, element) => {
        if (index >= limit) return false;
        
        const $el = $(element);
        const title = $el.find('h2 span').text().trim();
        const priceWhole = $el.find('.a-price-whole').first().text();
        const priceFraction = $el.find('.a-price-fraction').first().text();
        const image = $el.find('img.s-image').attr('src');
        const asin = $el.attr('data-asin');
        
        if (title && priceWhole) {
          const price = parseFloat(`${priceWhole}${priceFraction}`.replace(/[^\d.]/g, ''));
          products.push({
            name: title.substring(0, 80),
            description: `Produit Amazon - ${title.substring(0, 100)}`,
            price: price * 1.3, // Marge 30%
            supplierPrice: price,
            imageUrl: image,
            supplier: 'Amazon',
            supplierId: `AMZ-${asin || Date.now()}-${index}`,
            rating: parseFloat($el.find('.a-icon-alt').text()) || 4.0
          });
        }
      });
      
      console.log(`✅ ${products.length} produits trouvés sur Amazon`);
      return products;
      
    } catch (error) {
      console.error('❌ Erreur Amazon:', error.message);
      return [];
    }
  }

  // Scraper Wish (plus facile à scraper)
  async searchWish(query, limit = 10) {
    console.log(`🔍 Recherche Wish: "${query}"`);
    
    try {
      // Wish a une API publique
      const response = await axios.get(
        `https://www.wish.com/api/search?query=${encodeURIComponent(query)}&count=${limit}`,
        { headers: HEADERS, timeout: 10000 }
      );
      
      const data = response.data;
      if (!data.data || !data.data.products) return [];
      
      return data.data.products.map((p, index) => ({
        name: p.name?.substring(0, 80) || 'Produit Wish',
        description: p.description?.substring(0, 150) || `Produit tendance sur Wish`,
        price: parseFloat(p.commerce_product_info?.variations?.[0]?.localized_value?.localized_price?.replace(/[^\d.]/g, '') || 20) * 1.4,
        supplierPrice: parseFloat(p.commerce_product_info?.variations?.[0]?.localized_value?.localized_price?.replace(/[^\d.]/g, '') || 15),
        imageUrl: p.extra_photo_urls?.[0] || p.product_main_image,
        supplier: 'Wish',
        supplierId: `WISH-${p.id || Date.now()}-${index}`,
        rating: p.product_rating || 4.0
      }));
      
    } catch (error) {
      console.error('❌ Erreur Wish:', error.message);
      return [];
    }
  }

  // Méthode utilitaire pour extraire le prix
  extractPrice(text) {
    const match = text.match(/[\d.,]+/);
    if (!match) return 10;
    return parseFloat(match[0].replace(',', '.')) || 10;
  }

  // Recherche combinée sur plusieurs plateformes
  async searchAll(query, limit = 5) {
    console.log(`🌐 Recherche multi-plateforme: "${query}"`);
    
    const results = await Promise.allSettled([
      this.searchAliExpress(query, limit),
      this.searchAmazon(query, limit),
      this.searchWish(query, limit)
    ]);
    
    const allProducts = [];
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allProducts.push(...result.value);
      }
    });
    
    // Mélanger et limiter
    return this.shuffleArray(allProducts).slice(0, limit * 2);
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

module.exports = new ProductScraper();
