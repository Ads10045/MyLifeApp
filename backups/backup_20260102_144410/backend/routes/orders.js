const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// POST /api/orders - Créer une nouvelle commande
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, total, paymentMethod } = req.body; // items: [{ productId, quantity, price }]

    // 1. Validation basique
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Panier vide' });
    }

    // 2. Création de la commande
    const order = await prisma.order.create({
      data: {
        userId: req.user.userId,
        status: 'PAID', // On assume PAYÉ pour l'instant (simulation ou CashPlus)
        total: parseFloat(total),
        paymentMethod: paymentMethod, // 'cashplus', 'card', 'paypal'
        stripeId: paymentMethod === 'card' ? `ch_${Date.now()}` : null,
        items: {
          create: items.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: true
      }
    });

    res.status(201).json(order);

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Erreur lors de la commande' });
  }
});

// GET /api/orders/my-orders - Mes commandes
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: { items: { include: { product: true } } }, // Inclure détails produits
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Erreur récupération commandes' });
  }
});

module.exports = router;
