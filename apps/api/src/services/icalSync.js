const ical = require('node-ical');
const { CronJob } = require('cron');
const { prisma } = require('../lib/prisma');

async function triggerIcalSync() {
  const icalUrl = process.env.AIRBNB_ICAL_URL;
  if (!icalUrl) {
    console.warn('⚠️  AIRBNB_ICAL_URL not set — skipping iCal sync');
    return { count: 0 };
  }

  console.log('🔄 Syncing Airbnb iCal...');

  const events = await ical.async.fromURL(icalUrl);
  const blocked = [];

  for (const key of Object.keys(events)) {
    const event = events[key];
    if (event.type !== 'VEVENT') continue;

    const start = event.dtstart ? new Date(event.dtstart) : null;
    const end = event.dtend ? new Date(event.dtend) : null;

    if (!start || !end) continue;

    // Skip if it's in the past
    if (end < new Date()) continue;

    blocked.push({ startDate: start, endDate: end });
  }

  // Remove existing Airbnb iCal blocks and replace with fresh data
  await prisma.blockedDate.deleteMany({ where: { source: 'AIRBNB_ICAL' } });

  if (blocked.length > 0) {
    await prisma.blockedDate.createMany({
      data: blocked.map(b => ({
        startDate: b.startDate,
        endDate: b.endDate,
        source: 'AIRBNB_ICAL',
        note: 'Synced from Airbnb iCal',
      })),
    });
  }

  console.log(`✅ iCal sync complete: ${blocked.length} date range(s) blocked`);
  return { count: blocked.length };
}

function startIcalSync() {
  if (!process.env.AIRBNB_ICAL_URL) {
    console.warn('⚠️  AIRBNB_ICAL_URL not configured — iCal auto-sync disabled');
    return;
  }

  // Run immediately on startup
  triggerIcalSync().catch(console.error);

  // Then every 4 hours
  const job = new CronJob('0 */4 * * *', () => {
    triggerIcalSync().catch(console.error);
  });
  job.start();
  console.log('📅 Airbnb iCal sync scheduled every 4 hours');
}

module.exports = { triggerIcalSync, startIcalSync };
