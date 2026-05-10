const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { prisma } = require('../lib/prisma');
const { sendBookingConfirmation, sendHostBookingNotification } = require('../services/email');

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      try {
        const booking = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'CONFIRMED',
            stripePaymentId: session.payment_intent,
          },
        });

        // Send confirmation emails
        await Promise.all([
          sendBookingConfirmation(booking),
          sendHostBookingNotification(booking),
        ]);

        console.log(`✅ Booking ${bookingId} confirmed via Stripe`);
      } catch (err) {
        console.error('Error confirming booking:', err);
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;
    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      }).catch(console.error);
    }
  }

  res.json({ received: true });
});

module.exports = router;
