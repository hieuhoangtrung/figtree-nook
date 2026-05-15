const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { sendRescheduleRequestNotification } = require('../services/email');

// GET /api/my-booking?email=&bookingId=  - look up by email + booking ID suffix
router.get('/', async (req, res) => {
  try {
    const { email, bookingId } = req.query;
    if (!email || !bookingId) {
      return res.status(400).json({ error: 'email and bookingId required' });
    }
    const booking = await prisma.booking.findFirst({
      where: {
        guestEmail: { equals: email, mode: 'insensitive' },
        id: { endsWith: bookingId.toLowerCase() },
      },
      include: {
        rescheduleRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found. Check your email and booking reference.' });

    // Get conversation for this booking
    const conversation = await prisma.conversation.findFirst({
      where: { bookingId: booking.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    res.json({ booking, conversation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/my-booking/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const { email, reason } = req.body;
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, guestEmail: { equals: email, mode: 'insensitive' } },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'CANCELLED') return res.status(400).json({ error: 'Booking is already cancelled' });
    if (booking.status === 'REFUNDED') return res.status(400).json({ error: 'Booking is already refunded' });

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED', notes: booking.notes ? `${booking.notes}\n\nCancellation reason: ${reason || 'Not provided'}` : `Cancellation reason: ${reason || 'Not provided'}` },
    });

    // Cancel any pending scheduled messages
    await prisma.scheduledMessage.updateMany({
      where: { bookingId: booking.id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    // Notify host via conversation
    await createSystemMessage(booking.id, booking.guestEmail, booking.guestName,
      `Guest cancelled their booking. Reason: ${reason || 'Not provided'}`);

    res.json({ success: true, booking: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/my-booking/:id/reschedule
router.post('/:id/reschedule', async (req, res) => {
  try {
    const { email, requestedCheckIn, requestedCheckOut, guestNote } = req.body;
    if (!email || !requestedCheckIn || !requestedCheckOut) {
      return res.status(400).json({ error: 'email, requestedCheckIn, requestedCheckOut required' });
    }
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, guestEmail: { equals: email, mode: 'insensitive' } },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!['CONFIRMED', 'PENDING'].includes(booking.status)) {
      return res.status(400).json({ error: 'Only confirmed or pending bookings can be rescheduled' });
    }

    // Check for existing pending request
    const existing = await prisma.rescheduleRequest.findFirst({
      where: { bookingId: booking.id, status: 'PENDING' },
    });
    if (existing) return res.status(400).json({ error: 'You already have a pending reschedule request' });

    // Check new dates availability
    const start = new Date(requestedCheckIn);
    const end = new Date(requestedCheckOut);
    const conflict = await prisma.booking.findFirst({
      where: {
        id: { not: booking.id },
        status: { in: ['CONFIRMED', 'PENDING'] },
        checkIn: { lt: end },
        checkOut: { gt: start },
      },
    });
    const blockedConflict = await prisma.blockedDate.findFirst({
      where: { startDate: { lt: end }, endDate: { gt: start } },
    });
    if (conflict || blockedConflict) {
      return res.status(409).json({ error: 'The requested dates are not available. Please choose different dates.' });
    }

    const request = await prisma.rescheduleRequest.create({
      data: { bookingId: booking.id, requestedCheckIn: start, requestedCheckOut: end, guestNote: guestNote || null },
    });

    // Notify host
    await sendRescheduleRequestNotification(booking, request).catch(console.error);
    await createSystemMessage(booking.id, booking.guestEmail, booking.guestName,
      `Reschedule request: ${new Date(requestedCheckIn).toLocaleDateString('en-AU')} → ${new Date(requestedCheckOut).toLocaleDateString('en-AU')}. Note: ${guestNote || 'None'}`);

    res.json({ success: true, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/my-booking/:id/message  - guest sends message linked to booking
router.post('/:id/message', async (req, res) => {
  try {
    const { email, name, content } = req.body;
    if (!email || !content) return res.status(400).json({ error: 'email and content required' });

    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, guestEmail: { equals: email, mode: 'insensitive' } },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({ where: { bookingId: booking.id } });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { bookingId: booking.id, guestEmail: booking.guestEmail, guestName: name || booking.guestName, guestPhone: booking.guestPhone },
      });
    }

    const message = await prisma.conversationMessage.create({
      data: { conversationId: conversation.id, senderType: 'GUEST', content, channel: 'IN_APP' },
    });

    // Update conversation timestamp
    await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

    res.json({ success: true, message, conversationId: conversation.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/my-booking/:id/messages?email=  - get conversation thread
router.get('/:id/messages', async (req, res) => {
  try {
    const { email } = req.query;
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, guestEmail: { equals: email, mode: 'insensitive' } },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const conversation = await prisma.conversation.findFirst({
      where: { bookingId: booking.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    res.json({ conversation });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

async function createSystemMessage(bookingId, guestEmail, guestName, content) {
  let conversation = await prisma.conversation.findFirst({ where: { bookingId } });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { bookingId, guestEmail, guestName },
    });
  }
  await prisma.conversationMessage.create({
    data: { conversationId: conversation.id, senderType: 'GUEST', content, channel: 'IN_APP' },
  });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
}

module.exports = router;
