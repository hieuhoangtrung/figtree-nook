const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// GET /api/reviews (public)
router.get('/', async (req, res) => {
  try {
    const { featured } = req.query;
    const where = featured === 'true' ? { featured: true } : {};
    const reviews = await prisma.review.findMany({
      where, orderBy: { reviewDate: 'desc' },
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/reviews (admin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { guestName, rating, comment, reviewDate, source, featured } = req.body;
    const review = await prisma.review.create({
      data: {
        guestName, rating: parseFloat(rating), comment,
        reviewDate: new Date(reviewDate),
        source: source || 'manual',
        featured: featured || false,
      },
    });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/reviews/:id (admin)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/reviews/:id (admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
