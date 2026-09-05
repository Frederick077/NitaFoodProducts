import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Single Admin Account (No Manager)
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || 'admin@nitafoods.local';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      name: 'NITA Administrator',
    },
    create: {
      name: 'NITA Administrator',
      email: adminEmail,
      passwordHash,
    },
  });

  console.log(`✅ Admin account configured: ${admin.email}`);

  // 2. Seed Initial Products (if none exist)
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    const productsData = [
      {
        id: 'prod-1',
        name: 'NITA Pumpkin Seeds (Peeled)',
        slug: 'nita-pumpkin-seeds-peeled',
        shortDescription: '100% natural, premium hulled Tanzanian pumpkin seeds packed with zinc and magnesium.',
        description: 'Premium quality Tanzanian organic pumpkin seeds, shelled and ready to eat or add to healthy dishes. High in natural magnesium, zinc, and antioxidants. Produced under rigorous TBS-certified hygiene standards in our Dar es Salaam facility.',
        category: 'Seeds & Nuts',
        featuredImageUrl: '',
        available: true,
        isFeatured: true,
        ingredients: '100% natural, premium hulled Tanzanian organic pumpkin seeds.',
        benefits: 'Rich in antioxidants, supports prostate and heart health, high in iron, zinc, and dietary fiber.',
        images: [
          { imageUrl: '', altText: 'NITA Pumpkin Seeds Peeled Front Packaging', position: 0 },
          { imageUrl: '', altText: 'NITA Pumpkin Seeds Organic Seeds Close Up', position: 1 },
          { imageUrl: '', altText: 'NITA Pumpkin Seeds Nutrition Label', position: 2 },
        ],
        variants: [
          { name: '250g Pouch', size: '250g', price: 8000, compareAtPrice: 9500, available: true, stock: 120, sku: 'NITA-PS-250' },
          { name: '500g Stand-up Pouch', size: '500g', price: 15000, compareAtPrice: 17500, available: true, stock: 85, sku: 'NITA-PS-500' },
          { name: '1kg Family Eco-Pack', size: '1kg', price: 28000, compareAtPrice: 32000, available: true, stock: 40, sku: 'NITA-PS-1KG' },
        ],
      },
      {
        id: 'prod-2',
        name: 'NITA Pumpkin Seeds (Roasted & Lightly Salted)',
        slug: 'nita-pumpkin-seeds-roasted-salted',
        shortDescription: 'Crisp roasted pumpkin seeds lightly dusted with natural sea salt for daily snacking.',
        description: 'Deliciously roasted Tanzanian pumpkin seeds lightly tossed with organic sea salt. A healthy and satisfying crunch for work, fitness recovery, or travel. Free from synthetic additives or artificial flavorings.',
        category: 'Seeds & Nuts',
        featuredImageUrl: '',
        available: true,
        isFeatured: true,
        ingredients: 'Organic pumpkin seeds, organic sea salt, hint of cold-pressed sunflower oil.',
        benefits: 'Instant energy booster, outstanding source of plant protein, packed with healthy fats, and supports immunity.',
        images: [
          { imageUrl: '', altText: 'NITA Roasted Pumpkin Seeds Pack', position: 0 },
          { imageUrl: '', altText: 'NITA Roasted Seeds Bowl', position: 1 },
        ],
        variants: [
          { name: '150g On-the-Go Pack', size: '150g', price: 5500, compareAtPrice: 6500, available: true, stock: 150, sku: 'NITA-PSR-150' },
          { name: '250g Pouch', size: '250g', price: 9000, compareAtPrice: 10500, available: true, stock: 90, sku: 'NITA-PSR-250' },
          { name: '500g Pouch', size: '500g', price: 16500, compareAtPrice: 19000, available: true, stock: 60, sku: 'NITA-PSR-500' },
        ],
      },
      {
        id: 'prod-3',
        name: 'NITA Sunflower Seeds (Peeled & Cleaned)',
        slug: 'nita-sunflower-seeds-peeled',
        shortDescription: 'Sun-ripened, meticulously hulled sunflower seeds rich in Vitamin E and antioxidants.',
        description: 'Sun-ripened organic Tanzanian sunflower seeds, de-shelled with precision under pristine hygiene conditions. Perfect for direct snacking, salad toppings, morning porridge, and healthy baking recipes.',
        category: 'Seeds & Nuts',
        featuredImageUrl: '',
        available: true,
        isFeatured: true,
        ingredients: '100% organic Tanzanian shelled sunflower seeds.',
        benefits: 'Abundant in Vitamin E to support glowing skin, anti-inflammatory properties, regulates blood sugar, and supports immune system.',
        images: [
          { imageUrl: '', altText: 'NITA Sunflower Seeds Packaging', position: 0 },
          { imageUrl: '', altText: 'Sunflower Seeds Serving Bowl', position: 1 },
        ],
        variants: [
          { name: '250g Pouch', size: '250g', price: 5000, compareAtPrice: null, available: true, stock: 100, sku: 'NITA-SF-250' },
          { name: '500g Pouch', size: '500g', price: 9500, compareAtPrice: 11000, available: true, stock: 75, sku: 'NITA-SF-500' },
          { name: '1kg Value Pack', size: '1kg', price: 18000, compareAtPrice: 21000, available: true, stock: 35, sku: 'NITA-SF-1KG' },
        ],
      },
      {
        id: 'prod-4',
        name: 'NITA Honey & Raisin Granola Bar',
        slug: 'nita-honey-raisin-granola-bar',
        shortDescription: 'Baked whole-grain granola bar bound with wild Tanzanian forest honey and juicy raisins.',
        description: 'Baked whole-grain granola bar bound together with wild Tanzanian forest honey, premium raisins, organic sesame seeds, and toasted pumpkin seeds. No artificial colors, preservatives, or refined cane sugar.',
        category: 'Snacks & Energy Bars',
        featuredImageUrl: '',
        available: true,
        isFeatured: false,
        ingredients: 'Organic rolled oats, wild Tanzanian honey, premium dried raisins, sesame seeds, pumpkin seeds, cold-pressed sunflower oil.',
        benefits: 'High in dietary fiber, sustains energy release, aids digestive health, and makes a smart alternative to sugary snacks.',
        images: [
          { imageUrl: '', altText: 'NITA Honey Raisin Bar Front', position: 0 },
          { imageUrl: '', altText: 'NITA Granola Bar Multipack', position: 1 },
        ],
        variants: [
          { name: 'Single Bar (45g)', size: 'Single 45g', price: 1500, compareAtPrice: null, available: true, stock: 200, sku: 'NITA-GB-HR-1' },
          { name: 'Pack of 5 Bars', size: 'Pack of 5', price: 7000, compareAtPrice: 7500, available: true, stock: 80, sku: 'NITA-GB-HR-5' },
          { name: 'Box of 12 Bars', size: 'Box of 12', price: 16000, compareAtPrice: 18000, available: true, stock: 45, sku: 'NITA-GB-HR-12' },
        ],
      },
      {
        id: 'prod-5',
        name: 'NITA Chia & Sesame Power Crunch Bar',
        slug: 'nita-chia-sesame-power-crunch-bar',
        shortDescription: 'High-protein roasted sesame and whole chia seed energy bar with natural vanilla.',
        description: 'High-protein roasted sesame and whole chia seed granola bar sweetened naturally with raw honey. Specially crafted for athletes, busy professionals, students, and health-conscious families.',
        category: 'Snacks & Energy Bars',
        featuredImageUrl: '',
        available: true,
        isFeatured: false,
        ingredients: 'Organic rolled oats, roasted sesame seeds, organic chia seeds, Tanzanian forest honey, natural vanilla extract, sea salt.',
        benefits: 'Rich in Omega-3 fatty acids, supports brain and heart health, strong endurance fuel source, and high natural calcium.',
        images: [
          { imageUrl: '', altText: 'NITA Chia Sesame Bar Packaging', position: 0 },
        ],
        variants: [
          { name: 'Single Bar (45g)', size: 'Single 45g', price: 1800, compareAtPrice: null, available: true, stock: 180, sku: 'NITA-GB-CS-1' },
          { name: 'Pack of 5 Bars', size: 'Pack of 5', price: 8500, compareAtPrice: 9000, available: true, stock: 70, sku: 'NITA-GB-CS-5' },
          { name: 'Box of 12 Bars', size: 'Box of 12', price: 19500, compareAtPrice: 22000, available: true, stock: 30, sku: 'NITA-GB-CS-12' },
        ],
      },
    ];

    for (const p of productsData) {
      const { images, variants, ...prodData } = p;
      await prisma.product.create({
        data: {
          ...prodData,
          images: {
            create: images.map((img, idx) => ({
              imageUrl: img.imageUrl,
              altText: img.altText,
              position: img.position ?? idx,
            })),
          },
          variants: {
            create: variants.map((v) => ({
              name: v.name,
              size: v.size,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              available: v.available,
              stock: v.stock,
              sku: v.sku,
            })),
          },
        },
      });
    }
    console.log(`✅ Seeded ${productsData.length} initial products with images & variants.`);
  }

  // 3. Seed Initial Gallery items (if empty)
  const galleryCount = await prisma.galleryItem.count();
  if (galleryCount === 0) {
    const galleryCategories = [
      'Products',
      'Products',
      'Packaging',
      'Packaging',
      'Production Process',
      'Production Process',
      'Company Events',
      'Company Events',
      'Customers',
      'Customers',
    ];

    for (let i = 0; i < galleryCategories.length; i++) {
      await prisma.galleryItem.create({
        data: {
          id: `gal-${i + 1}`,
          title: `NITA Food Gallery #${i + 1}`,
          category: galleryCategories[i],
          imageUrl: '',
        },
      });
    }
    console.log(`✅ Seeded ${galleryCategories.length} gallery placeholders.`);
  }

  // 4. Seed Initial Message (if empty)
  const messageCount = await prisma.message.count();
  if (messageCount === 0) {
    await prisma.message.create({
      data: {
        id: 'msg-1',
        name: 'Fatma Said',
        email: 'fatmasaid@gmail.com',
        phone: '+255 784 111 222',
        subject: 'Wholesale Inquiry',
        message: 'Hello NITA Food Products. I run an organic supermarket in Dar es Salaam, and we are interested in stocking your whole line of peeled pumpkin seeds and granola bars. Can you provide wholesale price lists? Shukran.',
        status: 'New',
      },
    });
    console.log('✅ Seeded initial inquiry message.');
  }

  console.log('✨ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
