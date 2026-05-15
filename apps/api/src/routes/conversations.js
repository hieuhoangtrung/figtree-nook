const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { sendSms } = require('../services/sms');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// GET /api/admin/conversations - list all conversations
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          booking: { select: { id: true, status: true, checkIn: true, checkOut: true } },
          _count: { select: { messages: { where: { readAt: null, senderType: 'GUEST' } } } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.conversation.count(),
    ]);
    res.json({ conversations, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/conversations/unread-count
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const count = await prisma.conversationMessage.count({
      where: { readAt: null, senderType: 'GUEST' },
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/conversations/:id/messages
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        booking: true,
      },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Mark guest messages as read
    await prisma.conversationMessage.updateMany({
      where: { conversationId: req.params.id, senderType: 'GUEST', readAt: null },
      data: { readAt: new Date() },
    });

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/conversations/:id/reply - host sends reply
router.post('/:id/reply', requireAuth, async (req, res) => {
  try {
    const { content, channel } = req.body; // channel: EMAIL | SMS | BOTH | IN_APP
    if (!content) return res.status(400).json({ error: 'content required' });

    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: { booking: true },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Save message to DB
    const message = await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'HOST',
        content,
        channel: channel || 'IN_APP',
        readAt: new Date(), // host messages are auto-read
      },
    });
    await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

    const results = { inApp: true, email: false, sms: false };

    // Send email if requested
    if (['EMAIL', 'BOTH'].includes(channel)) {
      try {
        await transporter.sendMail({
          from: `"Figtree Nook" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
          to: conversation.guestEmail,
          subject: `Message from Figtree Nook`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #FF385C;">Message from your host 🏡</h2>
              <p>Hi ${conversation.guestName},</p>
              <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0;">${content.replace(/\n/g, '<br>')}</p>
              </div>
              <p style="color: #666; font-size: 14px;">You can reply by visiting <a href="${process.env.NEXTAUTH_URL}/my-booking">your booking page</a>.</p>
            </div>
          `,
        });
        results.email = true;
      } catch (e) { console.error('Email send failed:', e.message); }
    }

    // Send SMS if requested
    if (['SMS', 'BOTH'].includes(channel) && conversation.guestPhone) {
      const result = await sendSms(conversation.guestPhone,
        `Figtree Nook: ${content.slice(0, 130)}${content.length > 130 ? '...' : ''}`);
      results.sms = result.success;
    }

    res.json({ success: true, message, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/conversations  - start a new conversation with a guest
router.post('/', requireAuth, async (req, res) => {
  try {
    const { guestEmail, guestName, guestPhone, bookingId, content, channel } = req.body;
    if (!guestEmail || !guestName || !content) {
      return res.status(400).json({ error: 'guestEmail, guestName, content required' });
    }

    // Find existing or create conversation
    let conversation = bookingId
      ? await prisma.conversation.findFirst({ where: { bookingId } })
      : await prisma.conversation.findFirst({ where: { guestEmail: { equals: guestEmail, mode: 'insensitive' } } });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { guestEmail, guestName, guestPhone: guestPhone || null, bookingId: bookingId || null },
      });
    }

    // Re-use the reply endpoint logic by calling it inline
    const message = await prisma.conversationMessage.create({
      data: { conversationId: conversation.id, senderType: 'HOST', content, channel: channel || 'IN_APP', readAt: new Date() },
    });
    await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

    res.json({ success: true, conversation, message });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/conversations/reschedule-requests - view all pending reschedule requests
router.get('/reschedule-requests', requireAuth, async (req, res) => {
  try {
    const requests = await prisma.rescheduleRequest.findMany({
      where: { status: 'PENDING' },
      include: { booking: { select: { guestName: true, guestEmail: true, checkIn: true, checkOut: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/conversations/reschedule-requests/:id - approve or decline
router.patch('/reschedule-requests/:id', requireAuth, async (req, res) => {
  try {
    const { status, hostNote } = req.body; // APPROVED | DECLINED
    if (!['APPROVED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ error: 'status must be APPROVED or DECLINED' });
    }

    const request = await prisma.rescheduleRequest.update({
      where: { id: req.params.id },
      data: { status, hostNote: hostNote || null },
      include: { booking: true },
    });

    // If approved, update the booking dates
    if (status === 'APPROVED') {
      const nights = Math.round(
        (request.requestedCheckOut - request.requestedCheckIn) / (1000 * 60 * 60 * 24)
      );
      await prisma.booking.update({
        where: { id: request.bookingId },
        data: { checkIn: request.requestedCheckIn, checkOut: request.requestedCheckOut, nights },
      });
    }

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
