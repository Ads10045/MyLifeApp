const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get setting by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Réglage non trouvé' });
    }

    res.json(setting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update or settings
router.post('/', async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Key et Value requis' });
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    res.json(setting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur sauvegarde' });
  }
});

// Seed default IPTV URL if not exists (Helper endpoint)
router.post('/seed/iptv', async (req, res) => {
    const defaultUrl = "http://my.atrupo4k.com:80/get.php?username=omarskali&password=ycr2ib12&type=m3u_plus&output=m3u8";
    try {
        const setting = await prisma.setting.upsert({
            where: { key: 'iptv_url' },
            update: {}, // Don't overwrite if exists
            create: { key: 'iptv_url', value: defaultUrl },
        });
        res.json(setting);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

// PROXY to fetch M3U content (Avoids CORS on Web)
router.get('/playlist', async (req, res) => {
    try {
        const setting = await prisma.setting.findUnique({
            where: { key: 'iptv_url' }
        });

        if (!setting || !setting.value) {
            return res.status(404).json({ error: 'URL IPTV non configurée' });
        }

        console.log('Proxying playlist request to:', setting.value);
        
        // Fetch the external URL
        const response = await fetch(setting.value);
        if (!response.ok) {
            throw new Error(`Failed to fetch playlist: ${response.statusText}`);
        }

        const playlistText = await response.text();
        res.send(playlistText);

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
