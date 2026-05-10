const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { sendHostMessageNotification } = require('../services/email');

// POST /api/messages - guest sends message
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required' });
    }

    const msg = await prisma.message.create({
      data: { name, email, phone: phone || null, subject: subject || null, message },
    });

    // Notify host
    await sendHostMessageNotification(msg).catch(console.error);

    res.json({ success: true, id: msg.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/messages (admin)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { unread, page = 1, limit = 20 } = req.query;
    const where = unread === 'true' ? { read: false } : {};
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: parseInt(limit),
      }),
      prisma.message.count({ where }),
    ]);
    res.json({ messages, total });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/messages/:id/read (admin)
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const msg = await prisma.message.update({
      where: { id: req.params.id },
      data: { read: true, repliedAt: req.body.replied ? new Date() : undefined },
    });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/messages/:id (admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.message.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
