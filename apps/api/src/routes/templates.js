const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// GET /api/admin/templates
router.get('/', requireAuth, async (req, res) => {
  try {
    const templates = await prisma.messageTemplate.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/templates
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, type, subject, bodyHtml, bodySms, active, preArrivalHours } = req.body;
    if (!name || !type || !subject || !bodyHtml) {
      return res.status(400).json({ error: 'name, type, subject, bodyHtml required' });
    }
    const template = await prisma.messageTemplate.create({
      data: { name, type, subject, bodyHtml, bodySms: bodySms || null, active: active ?? true, preArrivalHours: preArrivalHours ? parseInt(preArrivalHours) : null },
    });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/templates/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const template = await prisma.messageTemplate.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/templates/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.messageTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/templates/scheduled - view scheduled messages
router.get('/scheduled', requireAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = status ? { status } : {};
    const [messages, total] = await Promise.all([
      prisma.scheduledMessage.findMany({
        where,
        include: { booking: { select: { guestName: true, guestEmail: true, checkIn: true } }, template: { select: { name: true } } },
        orderBy: { sendAt: 'asc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.scheduledMessage.count({ where }),
    ]);
    res.json({ messages, total });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
