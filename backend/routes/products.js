const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET all products (public) with Pagination
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = { isActive: true };
    
    if (category && category !== 'Tous') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count for pagination metadata
    const totalCount = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      products,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      total: totalCount
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET categories - MUST be before /:id
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category']
    });
    
    res.json(['Tous', ...categories.map(c => c.category)]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET trending products (best sellers) - MUST be before /:id
router.get('/meta/trending', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 6,
      orderBy: { margin: 'desc' }
    });
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET single product - MUST be after /meta/* routes
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST create product (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price, supplierPrice, imageUrl, category, supplierId, supplier, stock } = req.body;
    
    const margin = ((price - supplierPrice) / price) * 100;
    
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        supplierPrice: parseFloat(supplierPrice),
        margin,
        imageUrl,
        category,
        supplierId: supplierId || `LOCAL-${Date.now()}`,
        supplier: supplier || 'Local',
        stock: parseInt(stock) || 100
      }
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Erreur création produit' });
  }
});

// PUT update product (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price, supplierPrice, imageUrl, category, stock, isActive } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (supplierPrice) updateData.supplierPrice = parseFloat(supplierPrice);
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (category) updateData.category = category;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (price && supplierPrice) {
      updateData.margin = ((parseFloat(price) - parseFloat(supplierPrice)) / parseFloat(price)) * 100;
    }
    
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

// DELETE product (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

module.exports = router;
