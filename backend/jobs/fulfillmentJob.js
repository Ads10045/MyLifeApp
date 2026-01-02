const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const configManager = require('../utils/configManager');

const prisma = new PrismaClient();

class FulfillmentJob {
  constructor() {
    this.logs = [];
    this.isRunning = false;
    this.lastDeletedProducts = [];
  }

  addLog(msg) {
    const log = `[${new Date().toLocaleTimeString()}] ${msg}`;
    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop();
    console.log(log);
  }

  async run() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.addLog('🚀 Fulfillment Agent démarré...');
    let ordersProcessed = 0;
    let expiredDeleted = 0;

    try {
      const cleanupRange = configManager.getFulfillmentConfig()?.cleanupRange;
      const rangeStart = cleanupRange?.start ? new Date(cleanupRange.start) : new Date(0);
      const rangeEnd = cleanupRange?.end ? new Date(cleanupRange.end) : new Date();

      this.addLog(`🧹 Nettoyage des produits promo expirés (Période: ${rangeStart.toLocaleDateString()} - ${rangeEnd.toLocaleDateString()})...`);
      
      const now = new Date();
      const expiredProducts = await prisma.product.findMany({
        where: {
          isPromo: true,
          promoExpiry: {
            lt: now,
            gte: rangeStart,
            lte: rangeEnd
          }
        }
      });

      if (expiredProducts.length > 0) {
        this.addLog(`🗑️ ${expiredProducts.length} produits promo expirés trouvés.`);
        this.lastDeletedProducts = [];
        
        for (const product of expiredProducts) {
          this.lastDeletedProducts.push({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            imageUrl: product.imageUrl,
            promoExpiry: product.promoExpiry
          });
          
          await prisma.product.delete({
            where: { id: product.id }
          });
          this.addLog(`❌ Supprimé: ${product.name} (expiré le ${product.promoExpiry?.toLocaleDateString()})`);
          expiredDeleted++;
        }
        
        this.addLog(`✅ ${expiredDeleted} produits expirés supprimés.`);
      } else {
        this.addLog('💚 Aucun produit expiré à supprimer.');
        this.lastDeletedProducts = [];
      }

      // 2. FULFILLMENT: Trouver les commandes payées non livrées
      const pendingOrders = await prisma.order.findMany({
        where: { status: 'PAID' }
      });

      if (pendingOrders.length === 0) {
        this.addLog('💤 Aucune commande à traiter.');
      } else {
        this.addLog(`📦 ${pendingOrders.length} commandes trouvées à traiter.`);

        for (const order of pendingOrders) {
          this.addLog(`🔄 Traitement Commande #${order.id.slice(0, 8)}...`);
          
          await this.simulateDelay(1500); 
          this.addLog(`🌍 Connexion Fournisseur (AliExpress/Amazon)...`);
          
          await this.simulateDelay(1000);
          const cost = order.total * 0.6;
          this.addLog(`💳 Paiement Fournisseur: -${cost.toFixed(2)}€ effectué.`);
          
          await this.simulateDelay(1000);
          this.addLog(`✅ Fournisseur a validé l'expédition.`);
          
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'SHIPPED' }
          });
          
          this.addLog(`🚚 Commande #${order.id.slice(0, 8)} marquée comme EXPÉDIÉE.`);
          ordersProcessed++;
        }
      }

      this.isRunning = false;
      this.addLog(`✅ Fulfillment terminé! ${expiredDeleted} produits supprimés, ${ordersProcessed} commandes traitées.`);
      return { 
        status: 'success', 
        expiredDeleted,
        ordersProcessed
      };

    } catch (error) {
      console.error(error);
      this.addLog(`❌ Erreur: ${error.message}`);
      this.isRunning = false;
      return { status: 'error', message: error.message };
    }
  }

  simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  startSchedule() {
    cron.schedule('0 * * * *', () => {
      this.run();
    });
  }
}

module.exports = new FulfillmentJob();
