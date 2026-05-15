require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const availabilityRoutes = require('./routes/availability');
const messagingRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const pricingRoutes = require('./routes/pricing');
const reviewRoutes = require('./routes/reviews');
const stripeWebhook = require('./routes/stripeWebhook');
const verifyRoutes = require('./routes/verify');
const myBookingRoutes = require('./routes/myBooking');
const templateRoutes = require('./routes/templates');
const conversationRoutes = require('./routes/conversations');
const themeRoutes = require('./routes/theme');
const { startIcalSync } = require('./services/icalSync');
const { startScheduler } = require('./services/scheduler');

const app = express();
const PORT = process.env.API_PORT || 4000;

// Stripe webhook needs raw body - must be before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(helmet());
app.use(cors({
  origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/my-booking', myBookingRoutes);
app.use('/api/admin/templates', templateRoutes);
app.use('/api/admin/conversations', conversationRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/admin/theme', themeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  startIcalSync();
  startScheduler();
});

module.exports = app;
