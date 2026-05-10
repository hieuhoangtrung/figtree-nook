const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// GET /api/pricing (public - for frontend display)
router.get('/', async (req, res) => {
  try {
    const pricing = await prisma.pricingConfig.findFirst();
    const discounts = await prisma.discountRule.findMany({
      where: { active: true }, orderBy: { minNights: 'asc' },
    });
    res.json({ pricing, discounts });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/pricing (admin)
router.patch('/', requireAuth, async (req, res) => {
  try {
    const { nightlyRate, weekendSurcharge, cleaningFee, minNights, maxNights } = req.body;
    let pricing = await prisma.pricingConfig.findFirst();
    if (!pricing) {
      pricing = await prisma.pricingConfig.create({
        data: { nightlyRate: 120, cleaningFee: 40, minNights: 1, maxNights: 90 },
      });
    }
    const updated = await prisma.pricingConfig.update({
      where: { id: pricing.id },
      data: {
        ...(nightlyRate !== undefined && { nightlyRate: parseFloat(nightlyRate) }),
        ...(weekendSurcharge !== undefined && { weekendSurcharge: parseFloat(weekendSurcharge) }),
        ...(cleaningFee !== undefined && { cleaningFee: parseFloat(cleaningFee) }),
        ...(minNights !== undefined && { minNights: parseInt(minNights) }),
        ...(maxNights !== undefined && { maxNights: parseInt(maxNights) }),
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/pricing/discounts (admin)
router.post('/discounts', requireAuth, async (req, res) => {
  try {
    const { minNights, discountPercent, label } = req.body;
    const rule = await prisma.discountRule.create({
      data: { minNights: parseInt(minNights), discountPercent: parseFloat(discountPercent), label },
    });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/pricing/discounts/:id (admin)
router.patch('/discounts/:id', requireAuth, async (req, res) => {
  try {
    const rule = await prisma.discountRule.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/pricing/discounts/:id (admin)
router.delete('/discounts/:id', requireAuth, async (req, res) => {
  try {
    await prisma.discountRule.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
