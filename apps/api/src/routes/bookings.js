const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { sendBookingConfirmation, sendHostNotification } = require('../services/email');

// GET /api/bookings/price-preview
router.get('/price-preview', async (req, res) => {
  try {
    const { checkIn, checkOut, guests } = req.query;
    if (!checkIn || !checkOut) return res.status(400).json({ error: 'checkIn and checkOut required' });

    const pricing = await prisma.pricingConfig.findFirst();
    const discountRules = await prisma.discountRule.findMany({ where: { active: true }, orderBy: { minNights: 'desc' } });

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (nights < 1) return res.status(400).json({ error: 'Invalid dates' });

    const nightlyRate = pricing?.nightlyRate || 120;
    const cleaningFee = pricing?.cleaningFee || 40;

    // Apply discount
    let discountPercent = 0;
    let discountLabel = null;
    for (const rule of discountRules) {
      if (nights >= rule.minNights) {
        discountPercent = rule.discountPercent;
        discountLabel = rule.label;
        break;
      }
    }

    const subtotal = nightlyRate * nights;
    const discountAmount = Math.round((subtotal * discountPercent) / 100 * 100) / 100;
    const totalPrice = subtotal - discountAmount + cleaningFee;

    res.json({
      nights,
      nightlyRate,
      subtotal,
      cleaningFee,
      discountPercent,
      discountLabel,
      discountAmount,
      totalPrice,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/bookings/checkout - create Stripe checkout session
router.post('/checkout', async (req, res) => {
  try {
    const { guestName, guestEmail, guestPhone, checkIn, checkOut, guests, notes } = req.body;
    if (!guestName || !guestEmail || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check availability
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));

    const conflict = await prisma.booking.findFirst({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          { checkIn: { lt: end }, checkOut: { gt: start } },
        ],
      },
    });
    const blockedConflict = await prisma.blockedDate.findFirst({
      where: { startDate: { lt: end }, endDate: { gt: start } },
    });

    if (conflict || blockedConflict) {
      return res.status(409).json({ error: 'Selected dates are not available' });
    }

    // Calculate price
    const pricing = await prisma.pricingConfig.findFirst();
    const discountRules = await prisma.discountRule.findMany({ where: { active: true }, orderBy: { minNights: 'desc' } });

    const nightlyRate = pricing?.nightlyRate || 120;
    const cleaningFee = pricing?.cleaningFee || 40;

    let discountPercent = 0;
    for (const rule of discountRules) {
      if (nights >= rule.minNights) { discountPercent = rule.discountPercent; break; }
    }

    const subtotal = nightlyRate * nights;
    const discountAmount = Math.round((subtotal * discountPercent) / 100 * 100) / 100;
    const totalPrice = subtotal - discountAmount + cleaningFee;

    // Create pending booking
    const booking = await prisma.booking.create({
      data: {
        guestName, guestEmail, guestPhone: guestPhone || null,
        checkIn: start, checkOut: end, guests: parseInt(guests) || 1,
        nights, nightlyRate, cleaningFee, discountAmount, totalPrice,
        status: 'PENDING', notes: notes || null,
      },
    });

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: guestEmail,
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `Figtree Nook — ${nights} night${nights > 1 ? 's' : ''}`,
              description: `Check-in: ${checkIn} | Check-out: ${checkOut} | ${guests} guest(s)`,
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { bookingId: booking.id },
      success_url: `${process.env.NEXTAUTH_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/booking/cancelled`,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.id },
    });

    res.json({ url: session.url, sessionId: session.id, bookingId: booking.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bookings/confirm?session_id=xxx
router.get('/confirm', async (req, res) => {
  try {
    const { session_id } = req.query;
    const booking = await prisma.booking.findFirst({ where: { stripeSessionId: session_id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin routes
// GET /api/bookings (admin)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = status ? { status } : {};
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: parseInt(limit),
      }),
      prisma.booking.count({ where }),
    ]);
    res.json({ bookings, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/bookings/:id (admin - update status)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { ...(status && { status }), ...(notes !== undefined && { notes }) },
    });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/bookings/:id (admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.booking.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
