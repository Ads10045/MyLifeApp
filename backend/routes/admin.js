const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware pour vérifier le rôle admin
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé. Droits admin requis.' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Get all users (admin only) with pagination and search
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build search filter
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            Order: true,
            Location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create user (admin only)
router.post('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// Update user (admin only)
router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const updateData = { name, email, role };

    // Si un nouveau mot de passe est fourni
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Empêcher la suppression de son propre compte
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Get stats (admin only)
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const orderCount = await prisma.order.count();
    const locationCount = await prisma.location.count();

    const totalRevenue = await prisma.order.aggregate({
      _sum: { total: true },
    });

    res.json({
      users: userCount,
      orders: orderCount,
      locations: locationCount,
      revenue: totalRevenue._sum.total || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
