const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { triggerIcalSync } = require('../services/icalSync');

// GET /api/availability?year=2026&month=5
// Returns array of unavailable date strings "YYYY-MM-DD"
router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    // Get confirmed bookings
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        checkIn: { lte: endDate },
        checkOut: { gte: startDate },
      },
      select: { checkIn: true, checkOut: true },
    });

    // Get blocked dates
    const blocked = await prisma.blockedDate.findMany({
      where: {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { startDate: true, endDate: true },
    });

    // Generate list of unavailable date strings
    const unavailable = new Set();

    const addRange = (start, end) => {
      const cur = new Date(start);
      cur.setHours(0, 0, 0, 0);
      const endD = new Date(end);
      endD.setHours(0, 0, 0, 0);
      while (cur < endD) {
        unavailable.add(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    };

    bookings.forEach(b => addRange(b.checkIn, b.checkOut));
    blocked.forEach(b => addRange(b.startDate, b.endDate));

    res.json({ unavailable: Array.from(unavailable).sort() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/availability/block (admin)
router.post('/block', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, note } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate required' });
    }
    const blocked = await prisma.blockedDate.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        source: 'MANUAL',
        note: note || null,
      },
    });
    res.json(blocked);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/availability/block/:id (admin)
router.delete('/block/:id', requireAuth, async (req, res) => {
  try {
    await prisma.blockedDate.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/availability/blocked (admin)
router.get('/blocked', requireAuth, async (req, res) => {
  try {
    const blocked = await prisma.blockedDate.findMany({
      orderBy: { startDate: 'asc' },
    });
    res.json(blocked);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/availability/sync-ical (admin - manual trigger)
router.post('/sync-ical', requireAuth, async (req, res) => {
  try {
    const result = await triggerIcalSync();
    res.json({ success: true, message: `Synced ${result.count} blocked date ranges from Airbnb iCal` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'iCal sync failed: ' + err.message });
  }
});

module.exports = router;
