const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET all products (public) with Pagination
router.get('/', async (req, res) => {
  try {
    const { category, supplier, search, page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = { isActive: true };
    
    if (category && category !== 'Tous' && category !== 'Tout') {
      where.category = category;
    }

    if (supplier && supplier !== 'Tous' && supplier !== 'Tout') {
      where.supplier = { contains: supplier, mode: 'insensitive' };
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
    
    res.json(['Tout', ...categories.map(c => c.category).filter(Boolean)]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET suppliers
router.get('/meta/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.product.findMany({
      select: { supplier: true },
      distinct: ['supplier']
    });
    
    res.json(['Tous', ...suppliers.map(s => s.supplier).filter(Boolean)]);
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

// GET HTML Embed for Blogger (first 20 products)
router.get('/embed', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    let html = `
    <style>
      .nutriplus-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 20px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 10px;
      }
      .nutriplus-card {
        background: #ffffff;
        border-radius: 16px;
        border: 1px solid #eaeaea;
        overflow: hidden;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        display: flex;
        flex-direction: column;
      }
      .nutriplus-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.08);
      }
      .nutriplus-img {
        width: 100%;
        height: 200px;
        object-fit: cover;
      }
      .nutriplus-info {
        padding: 16px;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }
      .nutriplus-title {
        font-size: 15px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 8px 0;
        height: 44px;
        overflow: hidden;
        line-height: 1.4;
      }
      .nutriplus-price {
        font-size: 18px;
        font-weight: 700;
        color: #00814C;
        margin: 0 0 16px 0;
      }
      .nutriplus-btn {
        display: block;
        text-align: center;
        background: #00814C;
        color: white !important;
        padding: 10px;
        border-radius: 10px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 600;
        transition: background 0.2s;
      }
      .nutriplus-btn:hover {
        background: #00663d;
      }
    </style>
    <div class="nutriplus-grid">
    `;

    products.forEach(p => {
      const price = p.price?.toFixed(2) || '0.00';
      const image = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/220x200?text=No+Image';
      
      html += `
      <div class="nutriplus-card">
        <img src="${image}" class="nutriplus-img" alt="${p.name}">
        <div class="nutriplus-info">
          <h3 class="nutriplus-title">${p.name}</h3>
          <p class="nutriplus-price">${price} €</p>
          <a href="${p.sourceUrl}" target="_blank" class="nutriplus-btn">🛒 Voir sur le site</a>
        </div>
      </div>
      `;
    });

    html += `</div>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Embed error:', error);
    res.status(500).send('<p>Erreur lors du chargement des produits.</p>');
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
