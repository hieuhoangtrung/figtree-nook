const { CronJob } = require('cron');
const { prisma } = require('../lib/prisma');
const nodemailer = require('nodemailer');
const { sendSms } = require('./sms');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

/**
 * Interpolate template variables like {{guestName}}, {{checkIn}}, etc.
 */
function interpolate(text, booking) {
  if (!text) return '';
  const fmt = (d) => new Date(d).toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return text
    .replace(/\{\{guestName\}\}/g, booking.guestName || '')
    .replace(/\{\{guestEmail\}\}/g, booking.guestEmail || '')
    .replace(/\{\{guestPhone\}\}/g, booking.guestPhone || '')
    .replace(/\{\{checkIn\}\}/g, booking.checkIn ? fmt(booking.checkIn) : '')
    .replace(/\{\{checkOut\}\}/g, booking.checkOut ? fmt(booking.checkOut) : '')
    .replace(/\{\{nights\}\}/g, booking.nights || '')
    .replace(/\{\{guests\}\}/g, booking.guests || '')
    .replace(/\{\{totalPrice\}\}/g, booking.totalPrice ? `$${booking.totalPrice.toFixed(2)} AUD` : '')
    .replace(/\{\{bookingId\}\}/g, booking.id || '')
    .replace(/\{\{propertyName\}\}/g, 'Figtree Nook')
    .replace(/\{\{checkInTime\}\}/g, '3:00 PM')
    .replace(/\{\{checkOutTime\}\}/g, '11:00 AM')
    .replace(/\{\{siteUrl\}\}/g, process.env.NEXTAUTH_URL || 'http://localhost:3000');
}

/**
 * Process all due scheduled messages.
 */
async function processDueMessages() {
  const due = await prisma.scheduledMessage.findMany({
    where: { status: 'PENDING', sendAt: { lte: new Date() } },
    include: { booking: true },
    take: 50,
  });

  if (due.length === 0) return;
  console.log(`📬 Processing ${due.length} scheduled message(s)...`);

  for (const msg of due) {
    try {
      const booking = msg.booking;
      const subject = interpolate(msg.subject, booking);
      const bodyHtml = interpolate(msg.bodyHtml, booking);
      const bodySms = interpolate(msg.bodySms, booking);

      let sent = false;

      if (['EMAIL', 'BOTH'].includes(msg.channel) && booking.guestEmail) {
        await transporter.sendMail({
          from: `"Figtree Nook" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
          to: booking.guestEmail,
          subject,
          html: bodyHtml,
        });
        sent = true;
      }

      if (['SMS', 'BOTH'].includes(msg.channel) && booking.guestPhone) {
        await sendSms(booking.guestPhone, bodySms || subject);
        sent = true;
      }

      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: { status: 'SENT', sentAt: new Date() },
      });

      console.log(`✅ Scheduled message ${msg.id} sent to ${booking.guestEmail}`);
    } catch (err) {
      console.error(`❌ Failed to send scheduled message ${msg.id}:`, err.message);
      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: { status: 'FAILED', error: err.message },
      });
    }
  }
}

/**
 * Schedule pre-arrival messages for a newly confirmed booking.
 * Looks at all active PRE_ARRIVAL templates and creates ScheduledMessage rows.
 */
async function schedulePreArrivalMessages(booking) {
  try {
    const templates = await prisma.messageTemplate.findMany({
      where: { type: 'PRE_ARRIVAL', active: true },
    });

    for (const template of templates) {
      const hoursB4 = template.preArrivalHours || 48;
      const sendAt = new Date(booking.checkIn);
      sendAt.setHours(sendAt.getHours() - hoursB4);

      if (sendAt <= new Date()) {
        console.log(`⚠️  Pre-arrival message for booking ${booking.id} would be in the past — skipping`);
        continue;
      }

      await prisma.scheduledMessage.create({
        data: {
          bookingId: booking.id,
          templateId: template.id,
          subject: template.subject,
          bodyHtml: template.bodyHtml,
          bodySms: template.bodySms,
          sendAt,
          channel: 'EMAIL',
          status: 'PENDING',
        },
      });
      console.log(`📅 Scheduled pre-arrival message for booking ${booking.id} at ${sendAt.toISOString()}`);
    }
  } catch (err) {
    console.error('Failed to schedule pre-arrival messages:', err.message);
  }
}

/**
 * Start the scheduler cron (runs every 15 minutes).
 */
function startScheduler() {
  processDueMessages().catch(console.error);

  const job = new CronJob('*/15 * * * *', () => {
    processDueMessages().catch(console.error);
  });
  job.start();
  console.log('⏰ Message scheduler started (runs every 15 minutes)');
}

module.exports = { startScheduler, schedulePreArrivalMessages, processDueMessages, interpolate };
