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
      // 1. PRIORITÉ: RapidAPI (vrais produits Amazon/AliExpress)
      if (process.env.RAPIDAPI_KEY) {
        console.log(`🌐 Utilisation de RapidAPI avec: "${searchQuery}"`);
        let products = await rapidAPIService.searchAll(searchQuery, count);
        
        if (products.length > 0) {
          console.log(`✅ ${products.length} produits RÉELS trouvés via RapidAPI`);
          return this.formatProducts(products, category);
        }
      }
      
      // 2. Fallback: DummyJSON (produits de test réalistes)
      console.log('⚠️ RapidAPI indisponible, utilisation de DummyJSON');
      let products = await this.fetchFromDummyJSON(category, count);
      
      if (products.length > 0) {
        return products;
      }
      
      // 3. Dernier recours: Mock
      return this.mockProducts(category, count);
      
    } catch (error) {
      console.error('❌ Erreur sourcing:', error.message);
      return this.mockProducts(category, count);
    }
  }
  
  // Formater les produits RapidAPI
  formatProducts(products, category) {
    return products.map(p => ({
      ...p,
      category: category,
      margin: parseFloat(((p.price - p.supplierPrice) / p.price * 100).toFixed(1))
    }));
  }

  // DummyJSON API - Produits réalistes avec images
  async fetchFromDummyJSON(category, count) {
    const categoryMap = {
      'Tech': 'smartphones',
      'Mode': 'womens-dresses',
      'Maison': 'furniture',
      'Beauté': 'skincare',
      'Sport': 'sports-accessories',
      'Cuisine': 'groceries',
    };
    
    const djCat = categoryMap[category] || 'smartphones';
    
    try {
      const response = await axios.get(
        `https://dummyjson.com/products/category/${djCat}?limit=${count}`,
        { timeout: 10000 }
      );
      
      return (response.data.products || []).map(p => {
        const allImages = p.images || [p.thumbnail];
        return {
          name: p.title,
          description: p.description,
          price: parseFloat((p.price * 1.3).toFixed(2)),
          supplierPrice: parseFloat(p.price.toFixed(2)),
          category: category,
          imageUrl: p.thumbnail || allImages[0],
          images: allImages, // All product images
          supplier: p.brand || 'DummyJSON',
          supplierId: `DJ-${p.id}-${Date.now()}`,
          rating: p.rating,
          stock: p.stock,
          margin: 30
        };
      });
    } catch (error) {
      console.error('DummyJSON error:', error.message);
      return [];
    }
  }

  // Mock products (dernier recours)
  mockProducts(category, count) {
    const names = {
      'Tech': ['Écouteurs Bluetooth Pro', 'Chargeur Sans Fil 15W', 'Coque iPhone Élégante'],
      'Mode': ['Robe Été Fleurie', 'Sneakers Tendance', 'Sac à Main Cuir'],
      'Maison': ['Lampe LED Design', 'Coussin Décoratif', 'Organisateur Bureau'],
      'Beauté': ['Sérum Vitamine C', 'Palette Maquillage', 'Parfum Floral'],
      'Sport': ['Bande Fitness', 'Gourde Isotherme', 'Tapis Yoga Premium'],
      'Cuisine': ['Mixeur Portable', 'Moule Silicone', 'Ustensiles Bambou'],
    };
    
    const categoryNames = names[category] || names['Tech'];
    
    return Array.from({ length: count }, (_, i) => {
      const mainImage = `https://picsum.photos/seed/${Date.now() + i}/400/400`;
      // Generate 3-5 random images
      const extraImages = Array.from({ length: 3 }, (_, j) => 
        `https://picsum.photos/seed/${Date.now() + i + j + 100}/400/400`
      );
      
      return {
        name: categoryNames[i % categoryNames.length],
        description: `Produit tendance ${category} - Haute qualité, livraison rapide`,
        price: parseFloat((Math.random() * 40 + 15).toFixed(2)),
        supplierPrice: parseFloat((Math.random() * 10 + 5).toFixed(2)),
        category: category,
        imageUrl: mainImage,
        images: [mainImage, ...extraImages],
        supplier: 'AI Mock',
        supplierId: `MOCK-${Date.now()}-${i}`,
        margin: 60
      };
    });
  }
}

module.exports = new AIService();
