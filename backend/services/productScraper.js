const axios = require('axios');
const cheerio = require('cheerio');

// User-Agent pour simuler un navigateur
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

class ProductScraper {
  
  // Recherche sur AliExpress via leur page de recherche
  async searchAliExpress(query, limit = 10) {
    console.log(`🔍 Recherche AliExpress (FREE): "${query}"`);
    
    try {
      const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, { 
        headers: HEADERS,
        timeout: 10000 
      });
      
      const $ = cheerio.load(response.data);
      const products = [];
      
      // Selectors updated for 2024/2025 AliExpress mobile/web structures
      $('a[href*="/item/"], div[class*="item--container"], div[class*="product-card"]').each((index, element) => {
        if (products.length >= limit) return false;
        
        const $el = $(element);
        
        // Find title
        let title = $el.find('[class*="title"]').first().text().trim();
        if (!title) title = $el.find('h1, h2, h3').first().text().trim();
        if (!title && $el.attr('title')) title = $el.attr('title');

        // Find Price
        let priceText = $el.find('[class*="price"]').text();
        if (!priceText) priceText = $el.find('span:contains("€")').text() || $el.find('span:contains("$")').text();

        // Find Image
        let image = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
        
        // Find Link
        let link = $el.attr('href') || $el.find('a').attr('href');
        
        if (title && (priceText || image)) {
          const price = this.extractPrice(priceText);
          products.push({
            name: title.substring(0, 80),
            description: `Produit AliExpress - ${title.substring(0, 100)}`,
            price: price * 1.5, // RG: +50%
            supplierPrice: price,
            imageUrl: image?.startsWith('//') ? `https:${image}` : image,
            supplier: 'AliExpress',
            supplierId: `AE-${index}-${Date.now()}`,
            link: link?.startsWith('//') ? `https:${link}` : (link?.startsWith('http') ? link : `https://www.aliexpress.com${link}`)
          });
        }
      });
      
      // Fallback: Si rien n'est trouvé par sélecteur, tenter d'extraire de window.runParams
      if (products.length === 0 && response.data.includes('window.runParams')) {
          console.log('💡 Tentative d\'extraction via JSON (runParams)...');
          // Approche simple: chercher des URLs d'images et des prix dans le texte
      }

      console.log(`✅ ${products.length} produits trouvés sur AliExpress`);
      return products;
      
    } catch (error) {
      console.error('❌ Erreur AliExpress:', error.message);
      return [];
    }
  }

  // Scraper Amazon (Sans API)
  async searchAmazon(query, limit = 10) {
    console.log(`🔍 Recherche Amazon (FREE): "${query}"`);
    
    try {
      const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, { 
        headers: HEADERS,
        timeout: 10000 
      });
      
      const $ = cheerio.load(response.data);
      const products = [];
      
      $('.s-result-item').each((index, element) => {
        if (index >= limit) return false;
        
        const $el = $(element);
        const title = $el.find('h2 a span').text().trim();
        const priceWhole = $el.find('.a-price-whole').first().text();
        const image = $el.find('img.s-image').attr('src');
        const asin = $el.attr('data-asin');
        const link = $el.find('h2 a').attr('href');
        
        if (title && (priceWhole || image)) {
          const price = parseFloat(priceWhole.replace(/[^\d.]/g, '')) || 25;
          products.push({
            name: title.substring(0, 80),
            description: `Produit Amazon - ${title.substring(0, 100)}`,
            price: price * 1.3,
            supplierPrice: price,
            imageUrl: image,
            supplier: 'Amazon',
            supplierId: `AMZ-FREE-${asin || Date.now()}-${index}`,
            rating: parseFloat($el.find('.a-icon-alt').text()) || 4.0,
            link: link?.startsWith('http') ? link : `https://www.amazon.com${link}`
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

  // Scraper eBay (Sans API)
  async searchEbay(query, limit = 10) {
    console.log(`🔍 Recherche eBay: "${query}"`);
    
    try {
      const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_ipg=25`;
      
      const response = await axios.get(searchUrl, { 
        headers: HEADERS,
        timeout: 10000 
      });
      
      const $ = cheerio.load(response.data);
      const products = [];
      
      $('.s-item__wrapper').each((index, element) => {
        if (index >= limit) return false;
        
        const $el = $(element);
        const title = $el.find('.s-item__title').text().trim();
        const priceText = $el.find('.s-item__price').first().text();
        const image = $el.find('.s-item__image-img').attr('src') || $el.find('.s-item__image-img').attr('data-src');
        const link = $el.find('.s-item__link').attr('href');
        
        // Skip "Shop on eBay" placeholders
        if (title && title.toLowerCase().includes('shop on ebay')) return;

        if (title && priceText) {
          const price = this.extractPrice(priceText);
          products.push({
            name: title.substring(0, 80),
            description: `Produit eBay - ${title.substring(0, 100)}`,
            price: price * 1.4, // Marge 40%
            supplierPrice: price,
            imageUrl: image,
            supplier: 'eBay',
            supplierId: `EB-${Date.now()}-${index}`,
            link: link
          });
        }
      });
      
      console.log(`✅ ${products.length} produits trouvés sur eBay`);
      return products;
      
    } catch (error) {
      console.error('❌ Erreur eBay:', error.message);
      return [];
    }
  }

  // Scraper Wish (plus facile à scraper)
  async searchWish(query, limit = 10) {
    console.log(`🔍 Recherche Wish: "${query}"`);
    
    try {
      // Wish a une API publique de recherche
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
    if (!text) return 10;
    // Supprimer tout ce qui n'est pas chiffre, point ou virgule
    const cleaned = text.replace(/[^0-9,.]/g, '').replace(',', '.');
    const match = cleaned.match(/[\d.]+/);
    if (!match) return 10;
    return parseFloat(match[0]) || 10;
  }

  // Recherche combinée sur plusieurs plateformes
  async searchAll(query, limit = 5) {
    console.log(`🌐 Recherche multi-plateforme (FREE): "${query}"`);
    
    // On priorise les sources demandées: Amazon, AliExpress, eBay
    const results = await Promise.allSettled([
      this.searchAmazon(query, limit),
      this.searchAliExpress(query, limit),
      this.searchEbay(query, limit)
    ]);
    
    const allProducts = [];
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allProducts.push(...result.value);
      }
    });
    
    return allProducts;
  }
}

module.exports = new ProductScraper();
