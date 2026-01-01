const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class FulfillmentJob {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.logs = [];
  }

  addLog(message) {
    const log = `[${new Date().toLocaleTimeString()}] ${message}`;
    console.log(log);
    this.logs.unshift(log); // Add to beginning
    if (this.logs.length > 50) this.logs.pop(); // Keep last 50
  }

  async run() {
    if (this.isRunning) return { status: 'running', message: 'Job already running' };
    
    this.isRunning = true;
    this.lastRun = new Date();
    this.addLog('🚀 Démarrage du Fulfillment Auto...');

    try {
      // 1. Trouver les commandes payées non livrées
      const pendingOrders = await prisma.order.findMany({
        where: { status: 'PAID' }
      });

      if (pendingOrders.length === 0) {
        this.addLog('💤 Aucune commande à traiter.');
        this.isRunning = false;
        return { status: 'idle', message: 'No orders' };
      }

      this.addLog(`📦 ${pendingOrders.length} commandes trouvées à traiter.`);

      for (const order of pendingOrders) {
        this.addLog(`🔄 Traitement Commande #${order.id.slice(0, 8)}...`);
        
        // Simuler le processus d'achat fournisseur
        await this.simulateDelay(1500); 
        this.addLog(`🌍 Connexion Fournisseur (AliExpress/Amazon)...`);
        
        await this.simulateDelay(1000);
        const cost = order.total * 0.6; // Simuler coût fournisseur (60% du prix vente)
        this.addLog(`💳 Paiement Fournisseur: -${cost.toFixed(2)}€ effectué.`);
        
        await this.simulateDelay(1000);
        this.addLog(`✅ Fournisseur a validé l'expédition.`);
        
        // Mettre à jour la BDD
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'SHIPPED' } // Ou FULFILLED si vous avez ce status
        });
        
        this.addLog(`🚚 Commande #${order.id.slice(0, 8)} marquée comme EXPÉDIÉE.`);
      }

      this.isRunning = false;
      this.addLog('✅ Cycle de Fulfillment terminé.');
      return { status: 'success', processed: pendingOrders.length };

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
    // Run every hour
    cron.schedule('0 * * * *', () => {
      this.run();
    });
  }
}

module.exports = new FulfillmentJob();
