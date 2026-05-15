const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { sendOtpEmail } = require('../services/email');
const { sendSms } = require('../services/sms');

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/verify/send  { target, type: 'EMAIL'|'PHONE' }
router.post('/send', async (req, res) => {
  try {
    const { target, type } = req.body;
    if (!target || !['EMAIL', 'PHONE'].includes(type)) {
      return res.status(400).json({ error: 'target and type (EMAIL|PHONE) required' });
    }

    // Rate limit: max 3 codes per target per 10 min
    const recent = await prisma.verificationCode.count({
      where: {
        target,
        type,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });
    if (recent >= 3) {
      return res.status(429).json({ error: 'Too many verification attempts. Please wait 10 minutes.' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await prisma.verificationCode.create({ data: { target, code, type, expiresAt } });

    if (type === 'EMAIL') {
      await sendOtpEmail(target, code);
    } else {
      await sendSms(target, `Your Figtree Nook verification code is: ${code}. Valid for 15 minutes.`);
    }

    res.json({ success: true, message: `Verification code sent to ${type === 'EMAIL' ? 'your email' : 'your phone'}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// POST /api/verify/confirm  { target, type, code }
router.post('/confirm', async (req, res) => {
  try {
    const { target, type, code } = req.body;
    if (!target || !type || !code) {
      return res.status(400).json({ error: 'target, type and code required' });
    }

    const record = await prisma.verificationCode.findFirst({
      where: {
        target,
        type,
        code,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { verified: true },
    });

    res.json({ success: true, verified: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/verify/check  { target, type } - check if already verified (within 1h)
router.post('/check', async (req, res) => {
  try {
    const { target, type } = req.body;
    const record = await prisma.verificationCode.findFirst({
      where: {
        target, type, verified: true,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ verified: !!record });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
