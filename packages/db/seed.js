const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
  await prisma.adminUser.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@figtreenook.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@figtreenook.com',
      password: hashedPassword,
      name: 'Trang',
    },
  });

  // Default pricing
  const existingPricing = await prisma.pricingConfig.findFirst();
  if (!existingPricing) {
    await prisma.pricingConfig.create({
      data: {
        nightlyRate: 120,
        weekendSurcharge: 20,
        cleaningFee: 40,
        minNights: 1,
        maxNights: 90,
      },
    });
  }

  // Discount rules
  await prisma.discountRule.createMany({
    skipDuplicates: true,
    data: [
      { minNights: 7, discountPercent: 10, label: 'Weekly discount', active: true },
      { minNights: 28, discountPercent: 20, label: 'Monthly discount', active: true },
    ],
  });

  // Sample reviews (from Airbnb)
  await prisma.review.createMany({
    skipDuplicates: false,
    data: [
      {
        guestName: 'Prapaipun',
        rating: 5,
        comment: 'Easy to get through and helpful for recommending areas where to go and shopping for Asian food. Feels like you live in your own home. We appreciate it.',
        reviewDate: new Date('2026-03-15'),
        source: 'airbnb',
        featured: true,
      },
      {
        guestName: 'Ellen',
        rating: 5,
        comment: 'Very comfortable stay. And amazing communication from host.',
        reviewDate: new Date('2026-03-20'),
        source: 'airbnb',
        featured: true,
      },
      {
        guestName: 'Phoebe',
        rating: 5,
        comment: 'Enjoyed a private and tidy stay at Trang\'s studio in Figtree. Such a convenient location to pop into Wollongong or drive down to Shellharbour airport. Felt very safe and comfortable, loved having off street parking. Very helpful and responsive hosts. Can highly recommend staying here.',
        reviewDate: new Date('2026-03-22'),
        source: 'airbnb',
        featured: true,
      },
      {
        guestName: 'Christine',
        rating: 5,
        comment: 'Great safe location, secure parking, responsive and helpful hosts with great communication. Private space, comfortable with everything we needed including sweet additions like snacks, tea and coffee. Nice and close to town.',
        reviewDate: new Date('2026-03-25'),
        source: 'airbnb',
        featured: true,
      },
      {
        guestName: 'Jenny',
        rating: 5,
        comment: 'Trang was a great host with a clean and friendly home. The bed was very comfortable.',
        reviewDate: new Date('2026-03-28'),
        source: 'airbnb',
        featured: false,
      },
      {
        guestName: 'Kim',
        rating: 5,
        comment: 'Enjoyed my stay, and it was easy to communicate with the owners.',
        reviewDate: new Date('2026-02-10'),
        source: 'airbnb',
        featured: false,
      },
    ],
  });

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
