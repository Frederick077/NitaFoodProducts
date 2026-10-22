import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const isDatabaseConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');

let realPrisma: PrismaClient | null = null;

if (isDatabaseConfigured) {
  try {
    const globalForPrisma = globalThis as unknown as {
      prisma: PrismaClient | undefined;
    };
    realPrisma =
      globalForPrisma.prisma ??
      new PrismaClient({
        errorFormat: 'minimal',
      });
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = realPrisma;
    }
  } catch (err) {
    throw err;
  }
}

// In-memory fallback dataset for development / preview when DATABASE_URL is not yet connected
class InMemoryDB {
  admins: any[] = [];
  products: any[] = [];
  productImages: any[] = [];
  productVariants: any[] = [];
  galleryItems: any[] = [];
  siteImages: any[] = [];
  orders: any[] = [];
  messages: any[] = [];
  analyticsEvents: any[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('admin123', salt);
    this.admins.push({
      id: 'admin-1',
      name: 'NITA Administrator',
      email: 'admin@nitafoods.local',
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const defaultProducts = [
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
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date(),
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
        createdAt: new Date('2026-01-02'),
        updatedAt: new Date(),
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
        createdAt: new Date('2026-01-03'),
        updatedAt: new Date(),
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
        createdAt: new Date('2026-01-04'),
        updatedAt: new Date(),
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
        createdAt: new Date('2026-01-05'),
        updatedAt: new Date(),
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

    for (const p of defaultProducts) {
      const { images, variants, ...prodData } = p;
      this.products.push(prodData);
      
      images.forEach((img, idx) => {
        this.productImages.push({
          id: `img-${p.id}-${idx}`,
          productId: p.id,
          imageUrl: img.imageUrl,
          altText: img.altText,
          position: img.position,
          createdAt: new Date(),
        });
      });

      variants.forEach((v, idx) => {
        this.productVariants.push({
          id: `var-${p.id}-${idx}`,
          productId: p.id,
          name: v.name,
          size: v.size,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          available: v.available,
          stock: v.stock,
          sku: v.sku,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    }

    const categories = [
      'Products', 'Products', 'Packaging', 'Packaging', 
      'Production Process', 'Production Process', 'Company Events', 'Company Events', 
      'Customers', 'Customers'
    ];
    categories.forEach((cat, idx) => {
      this.galleryItems.push({
        id: `gal-${idx + 1}`,
        title: `NITA Food Gallery #${idx + 1}`,
        description: 'NITA Food Products Tanzanian Organic Facility',
        category: cat,
        imageUrl: '',
        storagePublicId: '',
        altText: `NITA Food Gallery Photo ${idx + 1}`,
        position: idx,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Site images start clean; user uploads via Admin Dashboard to Cloudinary
    this.siteImages = [];

    this.messages.push({
      id: 'msg-1',
      name: 'Fatma Said',
      email: 'fatmasaid@gmail.com',
      phone: '+255 784 111 222',
      subject: 'Wholesale Inquiry',
      message: 'Hello NITA Food Products. I run an organic supermarket in Dar es Salaam, and we are interested in stocking your whole line of peeled pumpkin seeds and granola bars. Can you provide wholesale price lists? Shukran.',
      status: 'New',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

const memDB = new InMemoryDB();

// Unified Prisma-compatible facade
export const prisma: any = {
  admin: {
    count: async () => {
      if (realPrisma) {
        try { return await realPrisma.admin.count(); } catch (e) { /* fallback */ }
      }
      return memDB.admins.length;
    },
    create: async ({ data }: any) => {
      if (realPrisma) {
        try { return await realPrisma.admin.create({ data }); } catch (e) { /* fallback */ }
      }
      const newAdmin = {
        id: `admin-${Date.now()}`,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memDB.admins.push(newAdmin);
      return newAdmin;
    },
    findUnique: async ({ where }: any) => {
      if (realPrisma) {
        try {
          const res = await realPrisma.admin.findUnique({ where });
          if (res) return res;
        } catch (e) { /* fallback */ }
      }
      if (where.email) {
        return memDB.admins.find((a) => a.email.toLowerCase() === where.email.toLowerCase()) || null;
      }
      if (where.id) {
        return memDB.admins.find((a) => a.id === where.id) || null;
      }
      return null;
    },
  },

  product: {
    count: async (args?: any) => {
      if (realPrisma) {
        try { return await realPrisma.product.count(args); } catch (e) { throw e; }
      }
      return memDB.products.length;
    },
    findMany: async (args?: any) => {
      if (realPrisma) {
        try { 
          return await realPrisma.product.findMany({
            ...args,
            include: { category: true, images: { orderBy: { position: 'asc' } }, variants: { orderBy: { price: 'asc' } } }
          }); 
        } catch (e) { throw e; }
      }
      let prods = [...memDB.products];
      if (args?.where) {
        if (args.where.isFeatured !== undefined) {
          prods = prods.filter(p => p.isFeatured === args.where.isFeatured);
        }
        if (args.where.category) {
          prods = prods.filter(p => p.category === args.where.category);
        }
        if (args.where.available !== undefined) {
          prods = prods.filter(p => p.available === args.where.available);
        }
      }
      return prods.map((p) => {
        const images = memDB.productImages
          .filter((img) => img.productId === p.id)
          .sort((a, b) => a.position - b.position);
        const variants = memDB.productVariants
          .filter((v) => v.productId === p.id)
          .sort((a, b) => a.price - b.price);
        return { ...p, images, variants };
      });
    },
    findUnique: async ({ where }: any) => {
      if (realPrisma) {
        try { 
          return await realPrisma.product.findUnique({ 
            where, 
            include: { category: true, images: { orderBy: { position: 'asc' } }, variants: { orderBy: { price: 'asc' } } } 
          }); 
        } catch (e) { throw e; }
      }
      const p = memDB.products.find((prod) => prod.id === where.id || prod.slug === where.slug);
      if (!p) return null;
      const images = memDB.productImages
        .filter((img) => img.productId === p.id)
        .sort((a, b) => a.position - b.position);
      const variants = memDB.productVariants
        .filter((v) => v.productId === p.id)
        .sort((a, b) => a.price - b.price);
      return { ...p, images, variants };
    },
    findFirst: async ({ where }: any) => {
      if (realPrisma) {
        try { 
          return await realPrisma.product.findFirst({ 
            where, 
            include: { category: true, images: { orderBy: { position: 'asc' } }, variants: { orderBy: { price: 'asc' } } } 
          }); 
        } catch (e) { throw e; }
      }
      const p = memDB.products.find((prod) => {
        if (where.id && prod.id === where.id) return true;
        if (where.slug && prod.slug === where.slug) return true;
        return false;
      });
      if (!p) return null;
      const images = memDB.productImages
        .filter((img) => img.productId === p.id)
        .sort((a, b) => a.position - b.position);
      const variants = memDB.productVariants
        .filter((v) => v.productId === p.id)
        .sort((a, b) => a.price - b.price);
      return { ...p, images, variants };
    },
    create: async ({ data }: any) => {
      requireDatabase();
      if (realPrisma) {
        try { 
          return await realPrisma.product.create({ 
            data, 
            include: { category: true, images: { orderBy: { position: 'asc' } }, variants: { orderBy: { price: 'asc' } } } 
          }); 
        } catch (e) { throw e; }
      }
      const newId = data.id || `prod-${Date.now()}`;
      const { images, variants, ...prodData } = data;
      const createdProduct = {
        id: newId,
        name: prodData.name,
        slug: prodData.slug || prodData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        shortDescription: prodData.shortDescription || '',
        description: prodData.description || '',
        category: prodData.category || 'Seeds & Nuts',
        featuredImageUrl: prodData.featuredImageUrl || '',
        available: prodData.available !== undefined ? prodData.available : true,
        isFeatured: prodData.isFeatured !== undefined ? prodData.isFeatured : false,
        ingredients: prodData.ingredients || '',
        benefits: prodData.benefits || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memDB.products.unshift(createdProduct);

      const createdImages: any[] = [];
      if (images?.create) {
        images.create.forEach((img: any, idx: number) => {
          const imgObj = {
            id: `img-${newId}-${idx}-${Date.now()}`,
            productId: newId,
            imageUrl: img.imageUrl || '',
            altText: img.altText || createdProduct.name,
            position: img.position ?? idx,
            createdAt: new Date(),
          };
          memDB.productImages.push(imgObj);
          createdImages.push(imgObj);
        });
      }

      const createdVariants: any[] = [];
      if (variants?.create) {
        variants.create.forEach((v: any, idx: number) => {
          const varObj = {
            id: `var-${newId}-${idx}-${Date.now()}`,
            productId: newId,
            name: v.name || v.size || 'Standard',
            size: v.size || 'Standard',
            price: Number(v.price) || 0,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            available: v.available !== undefined ? v.available : true,
            stock: v.stock !== undefined ? Number(v.stock) : 50,
            sku: v.sku || `SKU-${newId}-${idx}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          memDB.productVariants.push(varObj);
          createdVariants.push(varObj);
        });
      }

      return { ...createdProduct, images: createdImages, variants: createdVariants };
    },
    update: async ({ where, data }: any) => {
      requireDatabase();
      if (realPrisma) {
        try { 
          return await realPrisma.product.update({ 
            where, 
            data, 
            include: { category: true, images: { orderBy: { position: 'asc' } }, variants: { orderBy: { price: 'asc' } } } 
          }); 
        } catch (e) { throw e; }
      }
      const p = memDB.products.find((prod) => prod.id === where.id);
      if (!p) throw new Error('Product not found');

      const { images, variants, ...prodData } = data;
      Object.assign(p, prodData, { updatedAt: new Date() });

      if (images?.deleteMany) {
        memDB.productImages = memDB.productImages.filter((img) => img.productId !== where.id);
      }
      if (images?.create) {
        images.create.forEach((img: any, idx: number) => {
          memDB.productImages.push({
            id: `img-${where.id}-${idx}-${Date.now()}`,
            productId: where.id,
            imageUrl: img.imageUrl || '',
            altText: img.altText || p.name,
            position: img.position ?? idx,
            createdAt: new Date(),
          });
        });
      }

      if (variants?.deleteMany) {
        memDB.productVariants = memDB.productVariants.filter((v) => v.productId !== where.id);
      }
      if (variants?.create) {
        variants.create.forEach((v: any, idx: number) => {
          memDB.productVariants.push({
            id: `var-${where.id}-${idx}-${Date.now()}`,
            productId: where.id,
            name: v.name || v.size || 'Standard',
            size: v.size || 'Standard',
            price: Number(v.price) || 0,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            available: v.available !== undefined ? v.available : true,
            stock: v.stock !== undefined ? Number(v.stock) : 50,
            sku: v.sku || `SKU-${where.id}-${idx}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });
      }

      const updatedImages = memDB.productImages
        .filter((img) => img.productId === p.id)
        .sort((a, b) => a.position - b.position);
      const updatedVariants = memDB.productVariants
        .filter((v) => v.productId === p.id)
        .sort((a, b) => a.price - b.price);

      return { ...p, images: updatedImages, variants: updatedVariants };
    },
    delete: async ({ where }: any) => {
      if (realPrisma) {
        try { return await realPrisma.product.delete({ where }); } catch (e) { throw e; }
      }
      const idx = memDB.products.findIndex((prod) => prod.id === where.id);
      if (idx === -1) throw new Error('Product not found');
      const [deleted] = memDB.products.splice(idx, 1);
      memDB.productImages = memDB.productImages.filter((img) => img.productId !== where.id);
      memDB.productVariants = memDB.productVariants.filter((v) => v.productId !== where.id);
      return deleted;
    },
  },

  productImage: {
    findMany: async (args?: any) => {
      if (realPrisma) {
        try { return await (realPrisma as any).productImage.findMany(args); } catch (e) { /* fallback */ }
      }
      let items = [...memDB.productImages];
      if (args?.where?.productId) {
        items = items.filter((img) => img.productId === args.where.productId);
      }
      items.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      return items;
    },
    findUnique: async ({ where }: any) => {
      if (realPrisma) {
        try { return await (realPrisma as any).productImage.findUnique({ where }); } catch (e) { /* fallback */ }
      }
      return memDB.productImages.find((img) => img.id === where.id) || null;
    },
    delete: async ({ where }: any) => {
      if (realPrisma) {
        try { return await (realPrisma as any).productImage.delete({ where }); } catch (e) { /* fallback */ }
      }
      const idx = memDB.productImages.findIndex((img) => img.id === where.id);
      if (idx !== -1) {
        const [deleted] = memDB.productImages.splice(idx, 1);
        return deleted;
      }
      return { id: where.id };
    },
    update: async ({ where, data }: any) => {
      if (realPrisma) {
        try { return await (realPrisma as any).productImage.update({ where, data }); } catch (e) { /* fallback */ }
      }
      const img = memDB.productImages.find((i) => i.id === where.id);
      if (img) Object.assign(img, data);
      return img;
    },
    deleteMany: async ({ where }: any) => {
      if (realPrisma) {
        try { return await realPrisma.productImage.deleteMany({ where }); } catch (e) { /* fallback */ }
      }
      if (where?.productId) {
        memDB.productImages = memDB.productImages.filter((img) => img.productId !== where.productId);
      }
      return { count: 1 };
    },
    createMany: async ({ data }: any) => {
      if (realPrisma) {
        try { return await realPrisma.productImage.createMany({ data }); } catch (e) { /* fallback */ }
      }
      if (Array.isArray(data)) {
        data.forEach((item) => {
          memDB.productImages.push({
            id: `img-${Date.now()}-${Math.random()}`,
            productId: item.productId,
            imageUrl: item.imageUrl,
            altText: item.altText || '',
            position: item.position ?? 0,
            createdAt: new Date(),
          });
        });
      }
      return { count: data?.length || 0 };
    },
  },

  productVariant: {
    deleteMany: async ({ where }: any) => {
      if (realPrisma) {
        try { return await realPrisma.productVariant.deleteMany({ where }); } catch (e) { /* fallback */ }
      }
      if (where?.productId) {
        memDB.productVariants = memDB.productVariants.filter((v) => v.productId !== where.productId);
      }
      return { count: 1 };
    },
    createMany: async ({ data }: any) => {
      if (realPrisma) {
        try { return await realPrisma.productVariant.createMany({ data }); } catch (e) { /* fallback */ }
      }
      if (Array.isArray(data)) {
        data.forEach((item) => {
          memDB.productVariants.push({
            id: `var-${Date.now()}-${Math.random()}`,
            productId: item.productId,
            name: item.name || item.size || 'Standard',
            size: item.size || 'Standard',
            price: Number(item.price) || 0,
            compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : null,
            available: item.available !== undefined ? item.available : true,
            stock: item.stock !== undefined ? Number(item.stock) : 50,
            sku: item.sku || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });
      }
      return { count: data?.length || 0 };
    },
  },

  galleryItem: {
    count: async () => {
      if (realPrisma) {
        try { return await realPrisma.galleryItem.count(); } catch (e) { /* fallback */ }
      }
      return memDB.galleryItems.length;
    },
    findMany: async (args?: any) => {
      if (realPrisma) {
        try { return await realPrisma.galleryItem.findMany(args); } catch (e) { /* fallback */ }
      }
      let items = [...memDB.galleryItems];
      if (args?.where?.category) {
        items = items.filter((i) => i.category === args.where.category);
      }
      return items;
    },
    findUnique: async ({ where }: any) => {
      if (realPrisma) {
        try { return await realPrisma.galleryItem.findUnique({ where }); } catch (e) { /* fallback */ }
      }
      return memDB.galleryItems.find((g) => g.id === where.id) || null;
    },
    create: async ({ data }: any) => {
      if (realPrisma) {
        try { return await realPrisma.galleryItem.create({ data }); } catch (e) { /* fallback */ }
      }
      const newItem = {
        id: data.id || `gal-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memDB.galleryItems.unshift(newItem);
      return newItem;
    },
    update: async ({ where, data }: any) => {
      if (realPrisma) {
        try { return await realPrisma.galleryItem.update({ where, data }); } catch (e) { /* fallback */ }
      }
      const item = memDB.galleryItems.find((g) => g.id === where.id);
      if (!item) throw new Error('Gallery item not found');
      Object.assign(item, data, { updatedAt: new Date() });
      return item;
    },
    delete: async ({ where }: any) => {
      if (realPrisma) {
        try { return await realPrisma.galleryItem.delete({ where }); } catch (e) { /* fallback */ }
      }
      const idx = memDB.galleryItems.findIndex((g) => g.id === where.id);
      if (idx === -1) throw new Error('Gallery item not found');
      const [deleted] = memDB.galleryItems.splice(idx, 1);
      return deleted;
    },
  },

  siteImage: {
    findMany: async (args?: any) => {
      if (realPrisma) {
        try { return await (realPrisma as any).siteImage.findMany(args); } catch (e) { /* fallback */ }
      }
      let items = [...memDB.siteImages];
      if (args?.where?.section) {
        items = items.filter((i) => i.section.toUpperCase() === String(args.where.section).toUpperCase());
      }
      if (args?.where?.enabled !== undefined) {
        items = items.filter((i) => Boolean(i.enabled) === Boolean(args.where.enabled));
      }
      items.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      return items;
    },
    findUnique: async ({ where }: any) => {
      if (realPrisma) {
        try { return await (realPrisma as any).siteImage.findUnique({ where }); } catch (e) { /* fallback */ }
      }
      return memDB.siteImages.find((i) => i.id === where.id) || null;
    },
    create: async ({ data }: any) => {
      if (realPrisma) {
        try { return await (realPrisma as any).siteImage.create({ data }); } catch (e) { /* fallback */ }
      }
      const newItem = {
        id: data.id || `site-img-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memDB.siteImages.push(newItem);
      return newItem;
    },
    update: async ({ where, data }: any) => {
      if (realPrisma) {
        try { return await (realPrisma as any).siteImage.update({ where, data }); } catch (e) { /* fallback */ }
      }
      const item = memDB.siteImages.find((i) => i.id === where.id);
      if (!item) throw new Error('Site image not found');
      Object.assign(item, data, { updatedAt: new Date() });
      return item;
    },
    delete: async ({ where }: any) => {
      if (realPrisma) {
        try { return await (realPrisma as any).siteImage.delete({ where }); } catch (e) { /* fallback */ }
      }
      const idx = memDB.siteImages.findIndex((i) => i.id === where.id);
      if (idx === -1) throw new Error('Site image not found');
      const [deleted] = memDB.siteImages.splice(idx, 1);
      return deleted;
    },
    count: async (args?: any) => {
      if (realPrisma) {
        try { return await (realPrisma as any).siteImage.count(args); } catch (e) { /* fallback */ }
      }
      let items = [...memDB.siteImages];
      if (args?.where?.section) {
        items = items.filter((i) => i.section.toUpperCase() === String(args.where.section).toUpperCase());
      }
      return items.length;
    },
  },

  order: {
    findMany: (args?: Parameters<PrismaClient['order']['findMany']>[0]) => requireDatabase().order.findMany({ ...args, include: { items: true } }),
    create: (args: Parameters<PrismaClient['order']['create']>[0]) => requireDatabase().order.create(args),
    update: (args: Parameters<PrismaClient['order']['update']>[0]) => requireDatabase().order.update({ ...args, include: { items: true } }),
  },

  message: {
    count: async () => {
      if (realPrisma) {
        try { return await realPrisma.message.count(); } catch (e) { /* fallback */ }
      }
      return memDB.messages.length;
    },
    findMany: async (args?: any) => {
      if (realPrisma) {
        try { return await realPrisma.message.findMany(args); } catch (e) { /* fallback */ }
      }
      return [...memDB.messages];
    },
    create: async ({ data }: any) => {
      if (realPrisma) {
        try { return await realPrisma.message.create({ data }); } catch (e) { /* fallback */ }
      }
      const newMessage = {
        id: data.id || `msg-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memDB.messages.unshift(newMessage);
      return newMessage;
    },
  },

  analyticsEvent: {
    create: async ({ data }: any) => {
      if (realPrisma) {
        try { return await realPrisma.analyticsEvent.create({ data }); } catch (e) { /* fallback */ }
      }
      const ev = {
        id: `ev-${Date.now()}-${Math.random()}`,
        ...data,
        createdAt: new Date(),
      };
      memDB.analyticsEvents.push(ev);
      return ev;
    },
    findMany: async (args?: any) => {
      if (realPrisma) {
        try { return await realPrisma.analyticsEvent.findMany(args); } catch (e) { /* fallback */ }
      }
      return [...memDB.analyticsEvents].reverse().slice(0, args?.take || 1000);
    },
  },

  $disconnect: async () => {
    if (realPrisma) {
      try { await realPrisma.$disconnect(); } catch (e) {}
    }
  },
};

export default prisma;

export function requireDatabase(): PrismaClient {
  if (!realPrisma) throw new Error('PostgreSQL is not configured. Set DATABASE_URL before saving products or orders.');
  return realPrisma;
}
