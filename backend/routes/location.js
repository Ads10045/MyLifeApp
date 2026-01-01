const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all locations for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { userId: req.userId },
      orderBy: { timestamp: 'desc' },
    });

    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Save location
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude, address, street, city, postalCode, region, country } = req.body;

    const location = await prisma.location.create({
      data: {
        userId: req.userId,
        latitude,
        longitude,
        address,
        street,
        city,
        postalCode,
        region,
        country,
      },
    });

    res.json(location);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
  }
});

// Delete location
router.delete('/:id', authMiddleware, async (req, res) => {
  const fs = require('fs');
  const logMsg = `\n[${new Date().toISOString()}] DELETE REQUEST ID=${req.params.id} UserID=${req.userId}`;
  fs.appendFileSync('debug.log', logMsg);

  console.log('--- DELETE REQUEST ---');
  console.log('ID:', req.params.id);
  console.log('UserID:', req.userId);
  
  try {
    // Vérification existence avant suppression pour debug
    const existing = await prisma.location.findUnique({ where: { id: req.params.id } });
    
    fs.appendFileSync('debug.log', `\nExisting: ${existing ? 'YES' : 'NO'}`);
    if (existing) {
       fs.appendFileSync('debug.log', ` Owner: ${existing.userId} RequestUser: ${req.userId}`);
    }

    const { count } = await prisma.location.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    fs.appendFileSync('debug.log', `\nDeleted Count: ${count}`);

    if (count === 0) {
      return res.status(404).json({ error: 'Emplacement non trouvé ou accès non autorisé' });
    }

    res.json({ message: 'Emplacement supprimé' });
  } catch (error) {
    fs.appendFileSync('debug.log', `\nERROR: ${error.message}`);
    console.error('DELETE ERROR:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
