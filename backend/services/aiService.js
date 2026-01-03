const axios = require('axios');
const rapidAPIService = require('./rapidAPIService');

// Mots-clés de recherche par catégorie
const SEARCH_KEYWORDS = {
  'Tech': ['smartphone', 'wireless earbuds', 'smart watch', 'phone case'],
  'Mode': ['fashion dress', 'sneakers', 'handbag', 'sunglasses'],
  'Maison': ['home decor', 'led lights', 'organizer'],
  'Beauté': ['makeup kit', 'skincare set', 'perfume'],
  'Sport': ['fitness tracker', 'yoga mat', 'gym equipment'],
  'Cuisine': ['kitchen gadgets', 'coffee maker', 'blender'],
};

class AIService {
  // Récupère des produits RÉELS via RapidAPI (Amazon/AliExpress)
  async findTrendingProducts(category, count = 5) {
    console.log(`🔍 Recherche de produits RÉELS pour: ${category}`);
    
    // Choisir un mot-clé de recherche
    const keywords = SEARCH_KEYWORDS[category] || ['trending products'];
    const searchQuery = keywords[Math.floor(Math.random() * keywords.length)];
    
    try {
      // 1. Essayer d'abord le scraper GRATUIT (Pas de carte de paiement requise)
      console.log(`🌐 Utilisation du scraper gratuit pour: "${searchQuery}"`);
      const productScraper = require('./productScraper');
      let products = await productScraper.searchAll(searchQuery, count);
      
      if (products.length > 0) {
        console.log(`✅ ${products.length} produits trouvés via Scraper`);
        return this.formatProducts(products, category);
      }

      // 2. Fallback: RapidAPI (si configuré et fonctionnel)
      if (process.env.RAPIDAPI_KEY) {
        console.log(`🌐 Fallback sur RapidAPI avec: "${searchQuery}"`);
        products = await rapidAPIService.searchAll(searchQuery, count);
        
        if (products.length > 0) {
          console.log(`✅ ${products.length} produits RÉELS trouvés via RapidAPI`);
          return this.formatProducts(products, category);
        }
      }
      
      // 3. Last Resort: High-Quality Mock (pour garder l'UI vivante)
      console.log('🎭 Utilisation du MockService (Data Fallback)...');
      const mockService = require('./mockService');
      products = mockService.generateProducts(category, count);
      return products;
      
    } catch (error) {
      console.error('❌ Erreur sourcing:', error.message);
      // Even in catch, return something
      const mockService = require('./mockService');
      return mockService.generateProducts(category, count);
    }
  }
  
  // Formater les produits RapidAPI
  formatProducts(products, category) {
    return products.map(p => ({
      ...p,
      category: category,
      margin: p.price && p.supplierPrice ? parseFloat(((p.price - p.supplierPrice) / p.price * 100).toFixed(1)) : 0
    }));
  }
}

module.exports = new AIService();
