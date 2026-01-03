const cron = require('node-cron');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const aiService = require('../services/aiService');

const prisma = new PrismaClient();
const CATEGORIES = ['Tech', 'Cuisine', 'Mode', 'Sport', 'Maison', 'Beauté'];

class SourcingJob {
  constructor() {
    this.activeSources = []; // Tracks which sources are currently running
    this.lastRun = null;
    this.stats = {
      productsFound: 0,
      amazonCount: 0,
      aliexpressCount: 0,
      ebayCount: 0,
      lastRun: null,
      lastCategory: null,
      recentCategories: [], // Array of the last 3 categories
      featuredProducts: {
        Amazon: null,
        AliExpress: null,
        eBay: null
      },
      rules: {
        Amazon: 'Marge +30%',
        AliExpress: 'Marge +50%',
        eBay: 'Marge +40%'
      }
    };
    this.logs = [];
    this.lastProducts = []; // Store the results of the last run
    this.lastProductsBySource = {
        Amazon: [],
        AliExpress: [],
        eBay: []
    };
  }

  get isRunning() {
    return this.activeSources.length > 0;
  }

  addLog(message) {
      const log = `[${new Date().toLocaleTimeString()}] ${message}`;
      console.log(log);
      this.logs.unshift(log);
      if (this.logs.length > 50) this.logs.pop();
  }


  // Lance le job manuellement ou via Cron
  async run(specificSource = null) {
    const sourcesToRun = specificSource ? [specificSource] : ['Amazon', 'AliExpress', 'eBay'];
    
    // Check for concurrency conflicts
    if (specificSource) {
      if (this.activeSources.includes(specificSource) || this.activeSources.includes('Global')) {
        this.addLog(`⚠️ Sourcing ${specificSource} déjà en cours...`);
        return { status: 'running', message: `Job ${specificSource} déjà en cours` };
      }
      this.activeSources.push(specificSource);
    } else {
      if (this.activeSources.length > 0) {
        this.addLog('⚠️ Un job sourcing est déjà en cours, impossible de lancer le global.');
        return { status: 'running', message: 'Un job est déjà en cours' };
      }
      this.activeSources.push('Global');
    }

    this.lastRun = new Date();
    this.addLog(`🚀 Démarrage du Sourcing Agent${specificSource ? ` pour ${specificSource}` : ''}...`);
    
    try {
      // Refresh counts from DB at start
      const dbCounts = await prisma.product.groupBy({
        by: ['supplier'],
        _count: { id: true }
      });
      dbCounts.forEach(c => {
        if (c.supplier === 'Amazon') this.stats.amazonCount = c._count.id;
        if (c.supplier === 'AliExpress') this.stats.aliexpressCount = c._count.id;
        if (c.supplier === 'eBay') this.stats.ebayCount = c._count.id;
      });

      // 1. Choisir une catégorie
      const category = this.stats.lastCategory || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      this.stats.lastCategory = category;
      
      // Update recent categories (keep last 3)
      if (!this.stats.recentCategories.includes(category)) {
          this.stats.recentCategories = [category, ...this.stats.recentCategories].slice(0, 3);
      }

      this.addLog(`🔍 Cible: Catégorie "${category}"`);

      // 2. Demander à l'IA de trouver des produits
      this.addLog(`🌐 Scraping des produits tendance en cours...`);
      
      const productScraper = require('../services/productScraper');
      const rapidAPIService = require('../services/rapidAPIService');
      const mockService = require('../services/mockService');
      
      // Map category to a searchable keyword for better results
      const SEARCH_KEYWORDS = {
        'Tech': 'smartphone', 'Mode': 'fashion dress', 'Maison': 'home decor', 
        'Beauté': 'makeup set', 'Sport': 'fitness tracker', 'Cuisine': 'kitchen gadget'
      };
      const searchQuery = SEARCH_KEYWORDS[category] || category;

      let newProducts = [];

      if (specificSource === 'Amazon') {
        newProducts = await productScraper.searchAmazon(searchQuery, 10);
        if (newProducts.length === 0 && process.env.RAPIDAPI_KEY) {
            this.addLog(`🔄 Fallback Amazon via RapidAPI...`);
            newProducts = await rapidAPIService.searchAmazon(searchQuery, 10);
        }
        if (newProducts.length === 0) {
            this.addLog(`🎭 Fallback Amazon via MockService...`);
            newProducts = mockService.generateProducts(category, 5, 'Amazon');
        }
      } else if (specificSource === 'AliExpress') {
        newProducts = await productScraper.searchAliExpress(searchQuery, 10);
        if (newProducts.length === 0 && process.env.RAPIDAPI_KEY) {
            this.addLog(`🔄 Fallback AliExpress via RapidAPI...`);
            newProducts = await rapidAPIService.searchAliExpress(searchQuery, 10);
        }
        if (newProducts.length === 0) {
            this.addLog(`🎭 Fallback AliExpress via MockService...`);
            newProducts = mockService.generateProducts(category, 5, 'AliExpress');
        }
      } else if (specificSource === 'eBay') {
        newProducts = await productScraper.searchEbay(searchQuery, 10);
        if (newProducts.length === 0 && process.env.RAPIDAPI_KEY) {
            this.addLog(`🔄 Fallback eBay via RapidAPI...`);
            newProducts = await rapidAPIService.searchEbay(searchQuery, 10);
        }
        if (newProducts.length === 0) {
            this.addLog(`🎭 Fallback eBay via MockService...`);
            newProducts = mockService.generateProducts(category, 5, 'eBay');
        }
      } else {
        newProducts = await aiService.findTrendingProducts(category, 10);
      }

      this.addLog(`💡 ${newProducts.length} produits trouvés !`);
      
      // Reset run-specific featured products for THIS source
      if (!specificSource) {
        this.stats.featuredProducts = { Amazon: null, AliExpress: null, eBay: null };
      } else {
        this.stats.featuredProducts[specificSource] = null;
      }

      const runCounts = { Amazon: 0, AliExpress: 0, eBay: 0 };

      // 3. Ajouter en base
      let count = 0;
      const authorizedSuppliers = ['Amazon', 'AliExpress', 'eBay'];

      for (const p of newProducts) {
        const supplier = p.supplier || 'AI Agent';
        
        // STRICT BLOCK: Only import from authorized sources
        if (!authorizedSuppliers.includes(supplier)) {
          this.addLog(`⚠️ Ignoré: ${p.name} (Source non autorisée: ${supplier})`);
          continue;
        }

        this.addLog(`📊 Analyse rentabilité: ${p.name}...`);
        
        const marginValue = ((p.price - p.supplierPrice) / p.price) * 100;
        const imageUrl = p.imageUrl || `https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80`; 

        await prisma.product.upsert({
          where: { supplierId: p.supplierId || `AI-${Date.now()}-${count}` },
          create: {
            id: crypto.randomUUID(),
            name: p.name,
            description: p.description,
            price: parseFloat(p.price),
            supplierPrice: parseFloat(p.supplierPrice),
            margin: marginValue,
            imageUrl: imageUrl,
            images: p.images || [imageUrl],
            sourceUrl: p.link || null,
            category: p.category || category,
            supplier: p.supplier || 'AI Agent',
            supplierId: p.supplierId || `AI-${Date.now()}-${count}`,
            isActive: true,
            updatedAt: new Date()
          },
          update: { 
            sourceUrl: p.link || null,
            images: p.images || [imageUrl],
            updatedAt: new Date()
          } 
        });

        // Update counts and featured products
        if (supplier === 'Amazon') { 
          this.stats.amazonCount++; 
          runCounts.Amazon++;
          if (!this.stats.featuredProducts.Amazon) this.stats.featuredProducts.Amazon = p;
        }
        if (supplier === 'AliExpress') { 
          this.stats.aliexpressCount++; 
          runCounts.AliExpress++;
          if (!this.stats.featuredProducts.AliExpress) this.stats.featuredProducts.AliExpress = p;
        }
        if (supplier === 'eBay') { 
          this.stats.ebayCount++; 
          runCounts.eBay++;
          if (!this.stats.featuredProducts.eBay) this.stats.featuredProducts.eBay = p;
        }

        count++;
        this.addLog(`✅ Importé: ${p.name} (${supplier} | Marge: ${marginValue.toFixed(0)}%)`);
      }

      this.stats.productsFound += count;
      
      // Remove from active sources
      this.activeSources = this.activeSources.filter(s => s !== (specificSource || 'Global'));
      
      if (!specificSource) {
        this.lastProducts = newProducts; 
      } else {
        this.lastProductsBySource[specificSource] = newProducts;
      }

      // Final count refresh
      const finalCounts = await prisma.product.groupBy({
        by: ['supplier'],
        _count: { id: true }
      });
      finalCounts.forEach(c => {
        if (c.supplier === 'Amazon') this.stats.amazonCount = c._count.id;
        if (c.supplier === 'AliExpress') this.stats.aliexpressCount = c._count.id;
        if (c.supplier === 'eBay') this.stats.ebayCount = c._count.id;
      });

      this.addLog(`🎉 Sourcing terminé ! ${count} produits ajoutés.`);
      
      return { 
        status: 'success', 
        productsAdded: count, 
        category,
        products: newProducts,
        counts: runCounts
      };

    } catch (error) {
      console.error('❌ Erreur Sourcing Job:', error);
      this.addLog(`❌ Erreur: ${error.message}`);
      this.activeSources = this.activeSources.filter(s => s !== (specificSource || 'Global'));
      return { status: 'error', message: error.message };
    }
  }

  // Planifier le job (ex: tous les jours à 2h du matin)
  startSchedule() {
    // "0 2 * * *" = Tous les jours à 02:00
    cron.schedule('0 2 * * *', () => {
      console.log('⏰ Cron Job déclenché');
      this.run();
    });
    console.log('📅 Sourcing Agent planifié (02:00 AM daily)');
  }
}

module.exports = new SourcingJob();
