const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// GET /api/admin/dashboard - summary stats
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      unreadMessages,
      upcomingBookings,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.message.count({ where: { read: false } }),
      prisma.booking.findMany({
        where: { status: 'CONFIRMED', checkIn: { gte: new Date() } },
        orderBy: { checkIn: 'asc' },
        take: 5,
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Revenue this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const monthlyBookings = await prisma.booking.findMany({
      where: { status: 'CONFIRMED', createdAt: { gte: startOfMonth } },
      select: { totalPrice: true },
    });
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    res.json({
      stats: { totalBookings, confirmedBookings, pendingBookings, unreadMessages, monthlyRevenue },
      upcomingBookings,
      recentBookings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
