const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.isAdmin = isAdmin;
