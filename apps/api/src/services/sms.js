/**
 * SMS service using Twilio.
 * Falls back gracefully if TWILIO_ACCOUNT_SID is not configured.
 */

let twilioClient = null;

function getClient() {
  if (twilioClient) return twilioClient;
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || TWILIO_ACCOUNT_SID.startsWith('AC_placeholder')) {
    return null;
  }
  const twilio = require('twilio');
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilioClient;
}

/**
 * Send an SMS message.
 * @param {string} to - E.164 formatted phone number e.g. +61412345678
 * @param {string} body - SMS body text (max 160 chars recommended)
 * @returns {Promise<{success: boolean, sid?: string, error?: string}>}
 */
async function sendSms(to, body) {
  const client = getClient();
  if (!client) {
    console.warn(`⚠️  SMS not configured — would have sent to ${to}: ${body.slice(0, 40)}...`);
    return { success: false, error: 'SMS not configured' };
  }
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body,
    });
    console.log(`✅ SMS sent to ${to}: SID ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error(`❌ SMS failed to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendSms };
