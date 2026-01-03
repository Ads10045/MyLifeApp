const cron = require('node-cron');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const aiService = require('../services/aiService');

const prisma = new PrismaClient();
const CATEGORIES = ['Tech', 'Cuisine', 'Mode', 'Sport', 'Maison', 'Beauté'];

class SourcingJob {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.stats = { productsFound: 0, lastCategory: '' };
    this.logs = [];
    this.lastProducts = []; // Store the results of the last run
  }

  addLog(message) {
      const log = `[${new Date().toLocaleTimeString()}] ${message}`;
      console.log(log);
      this.logs.unshift(log);
      if (this.logs.length > 50) this.logs.pop();
  }


  // Lance le job manuellement ou via Cron
  async run() {
    if (this.isRunning) {
      this.addLog('⚠️ Job Sourcing déjà en cours...');
      return { status: 'running', message: 'Job déjà en cours' };
    }

    this.isRunning = true;
    this.lastRun = new Date();
    
    this.addLog('🚀 Démarrage du Sourcing Agent...');
    
    try {
      // 1. Choisir une catégorie aléatoire
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      this.stats.lastCategory = category;
      this.addLog(`🔍 Cible: Catégorie "${category}"`);

      // 2. Demander à l'IA de trouver des produits
      this.addLog(`🌐 Scraping des produits tendance en cours...`);
      // Removed fake scrapping time
      
      const newProducts = await aiService.findTrendingProducts(category, 10); // 10 produits par batch
      this.addLog(`💡 ${newProducts.length} produits trouvés !`);
      
      // Log détaillé des produits
      newProducts.forEach((p, i) => {
        this.addLog(`📦 ${p.name} | ${p.price}€ | via ${p.supplier}`);
      });

      // 3. Ajouter en base
      let count = 0;
      for (const p of newProducts) {
        // Removed fake analysis delay
        this.addLog(`📊 Analyse rentabilité: ${p.name}...`);
        
        // Calcul marge
        const margin = ((p.price - p.supplierPrice) / p.price) * 100;
        
        // Image par défaut si l'IA n'en donne pas (Unsplash source)
        const imageUrl = p.imageUrl || `https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80`; 

        await prisma.product.upsert({
          where: { supplierId: p.supplierId || `AI-${Date.now()}-${count}` },
          create: {
            id: crypto.randomUUID(),
            name: p.name,
            description: p.description,
            price: parseFloat(p.price),
            supplierPrice: parseFloat(p.supplierPrice),
            margin: margin,
            imageUrl: imageUrl,
            images: p.images || [imageUrl], // Multiple product images
            sourceUrl: p.link || null, // Original product URL (Amazon, AliExpress, etc.)
            category: p.category,
            supplier: p.supplier || 'AI Agent',
            supplierId: p.supplierId || `AI-${Date.now()}-${count}`,
            isActive: true,
            updatedAt: new Date()
          },
          update: { 
            sourceUrl: p.link || null,
            images: p.images || [imageUrl] // Update images too
          } 
        });
        count++;
        this.addLog(`✅ Importé: ${p.name} (Marge: ${margin.toFixed(0)}%)`);
      }

      this.stats.productsFound += count;
      this.isRunning = false;
      this.lastProducts = newProducts; // Store products for /status endpoint
      this.addLog(`🎉 Sourcing terminé ! ${count} produits ajoutés.`);
      
      return { 
        status: 'success', 
        productsAdded: count, 
        category,
        products: newProducts 
      };

    } catch (error) {
      console.error('❌ Erreur Sourcing Job:', error);
      this.addLog(`❌ Erreur: ${error.message}`);
      this.isRunning = false;
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
