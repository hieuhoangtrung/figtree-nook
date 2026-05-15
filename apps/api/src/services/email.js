const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

async function sendBookingConfirmation(booking) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #e91e8c; margin: 0;">🏡 Figtree Nook</h1>
        <p style="color: #666; margin-top: 5px;">Private Studio · Figtree, NSW, Australia</p>
      </div>
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #16a34a; margin-top: 0;">✅ Booking Confirmed!</h2>
        <p>Hi ${booking.guestName}, your booking has been confirmed. We can't wait to welcome you!</p>
      </div>
      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="margin-top: 0; color: #111;">📅 Booking Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666;">Check-in</td><td style="padding: 8px 0; font-weight: bold;">${formatDate(booking.checkIn)} <span style="color: #666; font-weight: normal;">(after 3:00 PM)</span></td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Check-out</td><td style="padding: 8px 0; font-weight: bold;">${formatDate(booking.checkOut)} <span style="color: #666; font-weight: normal;">(before 11:00 AM)</span></td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Duration</td><td style="padding: 8px 0; font-weight: bold;">${booking.nights} night${booking.nights > 1 ? 's' : ''}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Guests</td><td style="padding: 8px 0; font-weight: bold;">${booking.guests} guest${booking.guests > 1 ? 's' : ''}</td></tr>
        </table>
      </div>
      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="margin-top: 0; color: #111;">💰 Payment Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #666;">${formatCurrency(booking.nightlyRate)} × ${booking.nights} nights</td><td style="padding: 6px 0; text-align: right;">${formatCurrency(booking.nightlyRate * booking.nights)}</td></tr>
          ${booking.discountAmount > 0 ? `<tr><td style="padding: 6px 0; color: #16a34a;">Discount</td><td style="padding: 6px 0; text-align: right; color: #16a34a;">-${formatCurrency(booking.discountAmount)}</td></tr>` : ''}
          <tr><td style="padding: 6px 0; color: #666;">Cleaning fee</td><td style="padding: 6px 0; text-align: right;">${formatCurrency(booking.cleaningFee)}</td></tr>
          <tr style="border-top: 2px solid #e5e7eb;"><td style="padding: 12px 0 6px; font-weight: bold; font-size: 16px;">Total paid</td><td style="padding: 12px 0 6px; text-align: right; font-weight: bold; font-size: 16px;">${formatCurrency(booking.totalPrice)}</td></tr>
        </table>
      </div>
      <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin-top: 0; color: #92400e;">📍 Important Information</h3>
        <ul style="margin: 0; padding-left: 20px; color: #78350f;">
          <li>Check-in is <strong>self check-in</strong> via key safe</li>
          <li>The bathroom is <strong>separate from the studio</strong> — accessible from the backyard</li>
          <li>This is a <strong>non-smoking</strong> property</li>
          <li>Hosts live on-site on a separate floor</li>
          <li>Exact address will be shared 24 hours before check-in</li>
        </ul>
      </div>
      <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at <a href="mailto:${process.env.HOST_EMAIL}">${process.env.HOST_EMAIL}</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">Figtree Nook · Figtree, NSW 2525, Australia · PID-STRA-68016</p>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Figtree Nook" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: booking.guestEmail,
    subject: `✅ Booking Confirmed — Figtree Nook (${formatDate(booking.checkIn)})`,
    html,
  });
}

async function sendHostBookingNotification(booking) {
  const html = `
    <h2>🎉 New Booking Confirmed!</h2>
    <p><strong>Guest:</strong> ${booking.guestName} (${booking.guestEmail})</p>
    <p><strong>Check-in:</strong> ${formatDate(booking.checkIn)}</p>
    <p><strong>Check-out:</strong> ${formatDate(booking.checkOut)}</p>
    <p><strong>Nights:</strong> ${booking.nights}</p>
    <p><strong>Guests:</strong> ${booking.guests}</p>
    <p><strong>Total:</strong> ${formatCurrency(booking.totalPrice)}</p>
    <p><strong>Phone:</strong> ${booking.guestPhone || 'Not provided'}</p>
    ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
    <hr>
    <p><a href="${process.env.NEXTAUTH_URL}/admin/bookings/${booking.id}">View booking in admin →</a></p>
  `;

  await transporter.sendMail({
    from: `"Figtree Nook" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: process.env.HOST_EMAIL,
    subject: `🎉 New Booking: ${booking.guestName} — ${formatDate(booking.checkIn)}`,
    html,
  });
}

async function sendHostMessageNotification(message) {
  const html = `
    <h2>💬 New Message from ${message.name}</h2>
    <p><strong>From:</strong> ${message.name} &lt;${message.email}&gt;</p>
    ${message.phone ? `<p><strong>Phone:</strong> ${message.phone}</p>` : ''}
    ${message.subject ? `<p><strong>Subject:</strong> ${message.subject}</p>` : ''}
    <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0;">${message.message.replace(/\n/g, '<br>')}</p>
    </div>
    <p><a href="mailto:${message.email}">Reply to ${message.name} →</a></p>
    <p><a href="${process.env.NEXTAUTH_URL}/admin/messages">View in admin →</a></p>
  `;

  await transporter.sendMail({
    from: `"Figtree Nook" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: process.env.HOST_EMAIL,
    subject: `💬 New Message: ${message.subject || message.name} — Figtree Nook`,
    html,
  });
}

async function sendOtpEmail(email, code) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #FF385C; margin-bottom: 4px;">🏡 Figtree Nook</h2>
      <p style="color: #666; margin-top: 0;">Verification Code</p>
      <div style="background: #f9fafb; border-radius: 16px; padding: 32px; text-align: center; margin: 24px 0;">
        <p style="color: #666; margin: 0 0 12px;">Your verification code is:</p>
        <p style="font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #222; margin: 0;">${code}</p>
        <p style="color: #999; font-size: 13px; margin: 16px 0 0;">Valid for 15 minutes</p>
      </div>
      <p style="color: #666; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
  await transporter.sendMail({
    from: `"Figtree Nook" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: `Your Figtree Nook verification code: ${code}`,
    html,
  });
}

async function sendRescheduleRequestNotification(booking, request) {
  const html = `
    <h2>📅 Reschedule Request Received</h2>
    <p><strong>Guest:</strong> ${booking.guestName} (${booking.guestEmail})</p>
    <p><strong>Current dates:</strong> ${formatDate(booking.checkIn)} → ${formatDate(booking.checkOut)}</p>
    <p><strong>Requested dates:</strong> ${formatDate(request.requestedCheckIn)} → ${formatDate(request.requestedCheckOut)}</p>
    ${request.guestNote ? `<p><strong>Guest note:</strong> ${request.guestNote}</p>` : ''}
    <hr>
    <p><a href="${process.env.NEXTAUTH_URL}/admin/bookings/${booking.id}">Review request in admin →</a></p>
  `;
  await transporter.sendMail({
    from: `"Figtree Nook" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: process.env.HOST_EMAIL,
    subject: `📅 Reschedule Request: ${booking.guestName}`,
    html,
  });
}

module.exports = {
  sendBookingConfirmation,
  sendHostBookingNotification,
  sendHostMessageNotification,
  sendOtpEmail,
  sendRescheduleRequestNotification,
};
