const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/banners:
 *   get:
 *     summary: Retrieve all active banners
 *     tags: [Banners]
 */
router.get('/', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des bannières' });
  }
});

/**
 * @swagger
 * /api/banners/{id}:
 *   get:
 *     summary: Retrieve a single banner by ID
 *     tags: [Banners]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', async (req, res) => {
  try {
    const banner = await prisma.banner.findUnique({
      where: { id: req.params.id }
    });

    if (!banner) {
      return res.status(404).json({ error: 'Bannière non trouvée' });
    }

    res.json(banner);
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/banners/admin:
 *   get:
 *     summary: Retrieve all banners (Admin only)
 *     tags: [Banners]
 */
router.get('/admin', authenticateToken, isAdmin, async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/banners:
 *   post:
 *     summary: Create a new banner (Admin only)
 *     tags: [Banners]
 */
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, position, path, product1Id, product2Id, product3Id, product4Id, product5Id, product6Id } = req.body;
    
    const banner = await prisma.banner.create({
      data: {
        name,
        position,
        path,
        product1Id,
        product2Id,
        product3Id,
        product4Id,
        product5Id,
        product6Id,
        active: true
      }
    });
    
    res.status(201).json(banner);
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la bannière' });
  }
});

/**
 * @swagger
 * /api/banners/{id}:
 *   put:
 *     summary: Update a banner (Admin only)
 *     tags: [Banners]
 */
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const banner = await prisma.banner.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

/**
 * @swagger
 * /api/banners/{id}:
 *   delete:
 *     summary: Delete a banner (Admin only)
 *     tags: [Banners]
 */
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await prisma.banner.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Bannière supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

const axios = require('axios');

/**
 * @swagger
 * /api/banners/render/{id}:
 *   get:
 *     summary: Render banner HTML with dynamic product data (Secure SSR)
 *     tags: [Banners]
 */
router.get('/render/:id', async (req, res) => {
  try {
    const banner = await prisma.banner.findUnique({
      where: { id: req.params.id }
    });

    if (!banner) return res.status(404).send('Bannière non trouvée');

    // 1. Fetch associated products
    const productIds = [
      banner.product1Id, banner.product2Id, banner.product3Id,
      banner.product4Id, banner.product5Id, banner.product6Id
    ].filter(id => id);

    let products = [];
    if (productIds.length > 0) {
      products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });
    }

    // 2. Fetch HTML Template from GitHub
    const response = await axios.get(banner.path);
    let html = response.data;

    // 3. Dynamic Injection (Server-Side)
    html = html.replace(/\[BANNER_NAME\]/g, banner.name || "");
    html = html.replace(/\[BANNER_POSITION\]/g, banner.position || "");
    
    // Support [imageUrl] (1st product)
    if (products.length > 0) {
      html = html.replace(/\[imageUrl\]/g, products[0].imageUrl || "");
    }

    // Support numbered products [PRODUCT_IMAGE_1], etc.
    products.forEach((p, index) => {
      const i = index + 1;
      html = html.replace(new RegExp(`\\[PRODUCT_IMAGE_${i}\\]`, 'g'), p.imageUrl || "");
      html = html.replace(new RegExp(`\\[PRODUCT_NAME_${i}\\]`, 'g'), p.name || "");
      html = html.replace(new RegExp(`\\[PRODUCT_PRICE_${i}\\]`, 'g'), p.price ? p.price + "€" : "");
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error rendering banner:', error);
    res.status(500).send('Erreur lors du rendu de la bannière');
  }
});

module.exports = router;
