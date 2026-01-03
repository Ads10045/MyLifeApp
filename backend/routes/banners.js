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
    const { name, position, product1Id, product2Id, product3Id, product4Id, product5Id, product6Id } = req.body;
    
    const banner = await prisma.banner.create({
      data: {
        name,
        position,
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

module.exports = router;
