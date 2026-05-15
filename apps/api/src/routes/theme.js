const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// GET /api/theme  (public - frontend uses this)
router.get('/', async (req, res) => {
  try {
    let theme = await prisma.themeConfig.findFirst();
    if (!theme) {
      theme = await prisma.themeConfig.create({
        data: {
          primaryColor: '#FF385C',
          accentColor: '#222222',
          fontFamily: 'Inter',
          heroHeadline: 'Figtree Nook',
          heroSubtext: 'Private Studio in convenient Figtree location',
          footerText: '© Figtree Nook · Figtree, NSW 2525, Australia',
        },
      });
    }
    res.json(theme);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/theme  (admin only)
router.patch('/', requireAuth, async (req, res) => {
  try {
    let theme = await prisma.themeConfig.findFirst();
    if (!theme) {
      theme = await prisma.themeConfig.create({ data: {} });
    }
    const updated = await prisma.themeConfig.update({
      where: { id: theme.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
