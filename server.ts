import express from 'express';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { prisma } from './src/lib/prisma';
import { uploadImageFile, deleteImageFile, isCloudinaryConfigured, validateCloudinaryConfig } from './src/server/imageStorage';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nita-food-jwt-secret-key-2026';

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve local uploaded images statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Multer upload config: 10MB limit, image mimetypes only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported image format. Allowed formats: JPG, JPEG, PNG, WebP.'));
    }
  },
});

// Helper to ensure an Admin account exists on startup
async function ensureAdminExists() {
  try {
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      const adminEmail = process.env.ADMIN_INITIAL_EMAIL || 'admin@nitafoods.local';
      const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      await prisma.admin.create({
        data: {
          name: 'NITA Administrator',
          email: adminEmail,
          passwordHash,
        },
      });
      console.log(`[Database] Initial Admin account provisioned: ${adminEmail}`);
    }
  } catch (err) {
    console.warn('[Database] Note: Could not auto-check admin on boot (run prisma migrate if DB is new):', err);
  }
}

// Clean any legacy placeholder stock images from database
async function ensureDefaultSiteImages() {
  try {
    const legacyImages = await prisma.siteImage.findMany({
      where: {
        imageUrl: { contains: 'unsplash.com' }
      }
    });
    if (legacyImages.length > 0) {
      for (const img of legacyImages) {
        await prisma.siteImage.delete({ where: { id: img.id } });
      }
      console.log(`[Database] Removed ${legacyImages.length} legacy stock placeholder images.`);
    }
  } catch (err) {
    // Non-blocking database check
  }
}

// Token generation and verification
function generateToken(payload: { id: string; name: string; email: string; role: 'Admin' }) {
  const payloadStr = JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 });
  const base64Payload = Buffer.from(payloadStr).toString('base64');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(base64Payload).digest('hex');
  return `${base64Payload}.${signature}`;
}

function verifyToken(token: string) {
  try {
    const [base64Payload, signature] = token.split('.');
    if (!base64Payload || !signature) return null;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(base64Payload).digest('hex');
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// Auth Middleware
function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ success: false, error: 'Access denied. Authentication token is missing or invalid.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: 'Your session has expired. Please log in again.' });
  }

  req.user = decoded;
  next();
}

// Helper to format product for rich API response
function formatProduct(p: any) {
  const images = (p.images || []).map((img: any) => ({
    id: img.id,
    productId: img.productId,
    imageUrl: img.imageUrl || '',
    storagePublicId: img.storagePublicId || '',
    altText: img.altText || p.name || 'Product Image',
    position: img.position ?? 0,
    createdAt: img.createdAt ? (typeof img.createdAt === 'string' ? img.createdAt : img.createdAt.toISOString()) : new Date().toISOString(),
  }));

  const variants = (p.variants || []).map((v: any) => ({
    id: v.id,
    productId: v.productId,
    name: v.name || v.size || 'Standard',
    size: v.size || 'Standard',
    price: Number(v.price) || 0,
    compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
    available: v.available !== undefined ? Boolean(v.available) : true,
    stock: v.stock !== undefined ? Number(v.stock) : 50,
    sku: v.sku || '',
    createdAt: v.createdAt ? (typeof v.createdAt === 'string' ? v.createdAt : v.createdAt.toISOString()) : new Date().toISOString(),
    updatedAt: v.updatedAt ? (typeof v.updatedAt === 'string' ? v.updatedAt : v.updatedAt.toISOString()) : new Date().toISOString(),
  }));

  // Derive base price (minimum price among available variants or first variant)
  let basePrice = 0;
  let compareAtPrice: number | null = null;
  if (variants.length > 0) {
    const sorted = [...variants].sort((a, b) => a.price - b.price);
    basePrice = sorted[0].price;
    compareAtPrice = sorted[0].compareAtPrice || null;
  } else if (p.price) {
    basePrice = Number(p.price);
  }

  // Derive primary image
  const primaryImage = p.featuredImageUrl || (images.length > 0 ? images[0].imageUrl : '') || p.imageUrl || '';

  // Derive sizes array
  const sizes = variants.length > 0 ? variants.map((v: any) => v.size) : (p.sizes ? p.sizes.map((s: any) => (typeof s === 'string' ? s : s.size)) : ['250g', '500g', '1kg']);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug || p.id,
    shortDescription: p.shortDescription || '',
    description: p.description || '',
    category: p.category || 'Seeds & Nuts',
    featuredImageUrl: primaryImage,
    featuredImagePublicId: p.featuredImagePublicId || '',
    available: p.available !== undefined ? Boolean(p.available) : true,
    isFeatured: Boolean(p.isFeatured),
    ingredients: p.ingredients || '',
    benefits: p.benefits || '',
    images,
    variants,
    // Convenience backward-compatibility properties:
    price: basePrice,
    compareAtPrice,
    image: primaryImage,
    sizes,
    createdAt: p.createdAt ? (typeof p.createdAt === 'string' ? p.createdAt : p.createdAt.toISOString()) : new Date().toISOString(),
    updatedAt: p.updatedAt ? (typeof p.updatedAt === 'string' ? p.updatedAt : p.updatedAt.toISOString()) : new Date().toISOString(),
  };
}

// Helper to format gallery item
function formatGalleryItem(g: any) {
  return {
    id: g.id,
    title: g.title || '',
    description: g.description || '',
    image: g.imageUrl || '',
    imageUrl: g.imageUrl || '',
    storagePublicId: g.storagePublicId || '',
    altText: g.altText || g.title || '',
    position: g.position ?? 0,
    enabled: g.enabled !== undefined ? Boolean(g.enabled) : true,
    category: g.category,
    createdAt: g.createdAt ? (typeof g.createdAt === 'string' ? g.createdAt : g.createdAt.toISOString()) : new Date().toISOString(),
    updatedAt: g.updatedAt ? (typeof g.updatedAt === 'string' ? g.updatedAt : g.updatedAt.toISOString()) : new Date().toISOString(),
  };
}

// ==========================================
// API ENDPOINTS (PostgreSQL via Prisma)
// ==========================================

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: 'Admin',
    });

    res.json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'Admin',
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// --- ANALYTICS TRACKING ---
app.post('/api/analytics/visit', async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) return res.status(400).json({ error: 'Path is required' });

    await prisma.analyticsEvent.create({
      data: {
        eventType: 'pageview',
        page: path,
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Analytics track error:', err);
    res.status(500).json({ error: 'Could not record analytics event.' });
  }
});

app.get('/api/analytics', requireAuth, async (req, res) => {
  try {
    const [events, products, orders] = await Promise.all([
      prisma.analyticsEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2000,
      }),
      prisma.product.findMany(),
      prisma.order.findMany({
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const pageViews: Record<string, number> = {};
    const popularProducts: Record<string, number> = {};

    events.forEach((ev: any) => {
      if (ev.eventType === 'pageview') {
        pageViews[ev.page] = (pageViews[ev.page] || 0) + 1;
      }
      if (ev.productId) {
        popularProducts[ev.productId] = (popularProducts[ev.productId] || 0) + 1;
      }
    });

    let totalSales = 0;
    orders.forEach((o: any) => {
      if (o.status === 'Completed' && o.product) {
        const prod = formatProduct(o.product);
        totalSales += prod.price * o.quantity;
      }
    });

    res.json({
      visitors: events.length || 1,
      pageViews,
      popularProducts,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalSales,
      orders: orders.map((o: any) => ({
        id: o.id,
        customerName: o.customerName,
        phone: o.phone,
        productId: o.productId,
        productName: o.product?.name || 'Unknown Product',
        productPrice: o.product ? formatProduct(o.product).price : 0,
        quantity: o.quantity,
        size: o.size || 'Standard',
        status: o.status,
        createdAt: o.createdAt ? (typeof o.createdAt === 'string' ? o.createdAt : o.createdAt.toISOString()) : new Date().toISOString(),
      })),
    });
  } catch (err: any) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics summary.' });
  }
});

// --- PRODUCTS ---
app.get('/api/products', async (req, res) => {
  try {
    const { category, featured, search } = req.query;

    const where: any = {};
    if (featured === 'true') {
      where.isFeatured = true;
    }
    if (category && category !== 'All') {
      where.category = String(category);
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    let formatted = products.map(formatProduct);

    if (search) {
      const q = String(search).toLowerCase();
      formatted = formatted.filter(
        (p: any) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
          (p.ingredients && p.ingredients.toLowerCase().includes(q))
      );
    }

    res.json(formatted);
  } catch (err: any) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

// Alias
app.get('/api/admin/products', requireAuth, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(products.map(formatProduct));
  } catch (err: any) {
    console.error('Admin get products error:', err);
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

app.get('/api/products/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let product = await prisma.product.findUnique({
      where: { id: identifier },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { slug: identifier },
      });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Record product view event
    prisma.analyticsEvent
      .create({
        data: {
          eventType: 'product_view',
          page: `/products/${product.slug || product.id}`,
          productId: product.id,
        },
      })
      .catch(() => {});

    res.json(formatProduct(product));
  } catch (err: any) {
    console.error('Get product by identifier error:', err);
    res.status(500).json({ error: 'Failed to retrieve product details.' });
  }
});

// Create product
app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const {
      name,
      slug,
      shortDescription,
      description,
      category,
      featuredImageUrl,
      image,
      available,
      isFeatured,
      ingredients,
      benefits,
      images,
      variants,
      sizes,
      price,
    } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({ error: 'Name, description, and category are required.' });
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Ensure unique slug
    const finalSlug = generatedSlug || `product-${Date.now()}`;

    // Normalize images
    let imagesCreate: any[] = [];
    if (Array.isArray(images) && images.length > 0) {
      imagesCreate = images.map((img: any, idx: number) => ({
        imageUrl: typeof img === 'string' ? img : img.imageUrl || '',
        storagePublicId: typeof img === 'object' && img.storagePublicId ? img.storagePublicId : '',
        altText: typeof img === 'object' && img.altText ? img.altText : `${name} image ${idx + 1}`,
        position: typeof img === 'object' && img.position !== undefined ? img.position : idx,
      }));
    } else if (featuredImageUrl || image) {
      imagesCreate = [{
        imageUrl: featuredImageUrl || image,
        storagePublicId: req.body.featuredImagePublicId || '',
        altText: `${name} primary image`,
        position: 0
      }];
    }

    // Normalize variants
    let variantsCreate: any[] = [];
    if (Array.isArray(variants) && variants.length > 0) {
      variantsCreate = variants.map((v: any, idx: number) => ({
        name: v.name || v.size || 'Standard',
        size: v.size || 'Standard',
        price: Number(v.price) || Number(price) || 0,
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        available: v.available !== undefined ? Boolean(v.available) : true,
        stock: v.stock !== undefined ? Number(v.stock) : 50,
        sku: v.sku || `SKU-${Date.now()}-${idx}`,
      }));
    } else if (Array.isArray(sizes) && sizes.length > 0) {
      variantsCreate = sizes.map((s: string, idx: number) => ({
        name: s,
        size: s,
        price: Number(price) || 10000,
        compareAtPrice: null,
        available: true,
        stock: 50,
        sku: `SKU-${Date.now()}-${idx}`,
      }));
    } else {
      variantsCreate = [
        {
          name: 'Standard',
          size: '250g',
          price: Number(price) || 10000,
          compareAtPrice: null,
          available: true,
          stock: 50,
          sku: `SKU-${Date.now()}-0`,
        },
      ];
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        shortDescription: shortDescription || '',
        description,
        category,
        featuredImageUrl: featuredImageUrl || image || (imagesCreate[0]?.imageUrl || ''),
        featuredImagePublicId: req.body.featuredImagePublicId || '',
        available: available !== undefined ? Boolean(available) : true,
        isFeatured: Boolean(isFeatured),
        ingredients: ingredients || '',
        benefits: benefits || '',
        images: {
          create: imagesCreate,
        },
        variants: {
          create: variantsCreate,
        },
      },
    });

    res.status(201).json(formatProduct(product));
  } catch (err: any) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product in database.' });
  }
});

// Update product
app.put('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const {
      name,
      slug,
      shortDescription,
      description,
      category,
      featuredImageUrl,
      featuredImagePublicId,
      image,
      available,
      isFeatured,
      ingredients,
      benefits,
      images,
      variants,
      sizes,
      price,
    } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Build update object
    const newFeaturedImg = featuredImageUrl !== undefined ? featuredImageUrl : (image !== undefined ? image : existing.featuredImageUrl);
    if (newFeaturedImg && newFeaturedImg !== existing.featuredImageUrl && existing.featuredImagePublicId) {
      await deleteImageFile(existing.featuredImagePublicId, existing.featuredImageUrl);
    }

    const updateData: any = {
      name: name !== undefined ? name : existing.name,
      slug: slug !== undefined ? slug : existing.slug,
      shortDescription: shortDescription !== undefined ? shortDescription : existing.shortDescription,
      description: description !== undefined ? description : existing.description,
      category: category !== undefined ? category : existing.category,
      featuredImageUrl: newFeaturedImg,
      featuredImagePublicId: featuredImagePublicId !== undefined ? featuredImagePublicId : existing.featuredImagePublicId,
      available: available !== undefined ? Boolean(available) : existing.available,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existing.isFeatured,
      ingredients: ingredients !== undefined ? ingredients : existing.ingredients,
      benefits: benefits !== undefined ? benefits : existing.benefits,
    };

    // Update images if provided
    if (images !== undefined) {
      updateData.images = {
        deleteMany: {},
        create: Array.isArray(images)
          ? images.map((img: any, idx: number) => ({
              imageUrl: typeof img === 'string' ? img : img.imageUrl || '',
              storagePublicId: typeof img === 'object' && img.storagePublicId ? img.storagePublicId : '',
              altText: typeof img === 'object' && img.altText ? img.altText : `${updateData.name} image ${idx + 1}`,
              position: typeof img === 'object' && img.position !== undefined ? img.position : idx,
            }))
          : [],
      };
    }

    // Update variants if provided
    if (variants !== undefined) {
      updateData.variants = {
        deleteMany: {},
        create: Array.isArray(variants)
          ? variants.map((v: any, idx: number) => ({
              name: v.name || v.size || 'Standard',
              size: v.size || 'Standard',
              price: Number(v.price) || 0,
              compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
              available: v.available !== undefined ? Boolean(v.available) : true,
              stock: v.stock !== undefined ? Number(v.stock) : 50,
              sku: v.sku || `SKU-${existing.id}-${idx}`,
            }))
          : [],
      };
    } else if (sizes !== undefined) {
      const sizesList = Array.isArray(sizes)
        ? sizes.map((s: string) => s.trim()).filter(Boolean)
        : typeof sizes === 'string'
        ? sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      updateData.variants = {
        deleteMany: {},
        create: sizesList.map((s: string, idx: number) => ({
          name: s,
          size: s,
          price: price !== undefined ? Number(price) : 10000,
          compareAtPrice: null,
          available: true,
          stock: 50,
          sku: `SKU-${existing.id}-${idx}`,
        })),
      };
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(formatProduct(updated));
  } catch (err: any) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// Delete product
app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true },
    });

    if (existing) {
      if (existing.featuredImagePublicId || existing.featuredImageUrl) {
        await deleteImageFile(existing.featuredImagePublicId, existing.featuredImageUrl);
      }
      for (const img of existing.images) {
        if (img.storagePublicId || img.imageUrl) {
          await deleteImageFile(img.storagePublicId, img.imageUrl);
        }
      }
    }

    const deleted = await prisma.product.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Product deleted successfully', product: formatProduct(deleted) });
  } catch (err: any) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// Delete a specific product secondary image
app.delete('/api/admin/products/:productId/images/:imageId', requireAuth, async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    const img = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!img) {
      return res.status(404).json({ error: 'Product image not found.' });
    }
    if (img.storagePublicId || img.imageUrl) {
      await deleteImageFile(img.storagePublicId, img.imageUrl);
    }
    await prisma.productImage.delete({ where: { id: imageId } });

    const updatedProd = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { position: 'asc' } }, variants: true },
    });
    res.json({ success: true, message: 'Image deleted', product: formatProduct(updatedProd) });
  } catch (err: any) {
    console.error('Delete product image error:', err);
    res.status(500).json({ error: 'Failed to delete product image.' });
  }
});

// Reorder product secondary images
app.put('/api/admin/products/:productId/images/reorder', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { items } = req.body;
    if (Array.isArray(items)) {
      await Promise.all(
        items.map((item: any, idx: number) =>
          prisma.productImage.update({
            where: { id: item.id },
            data: { position: item.position !== undefined ? Number(item.position) : idx },
          })
        )
      );
    }
    const updatedProd = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { position: 'asc' } }, variants: true },
    });
    res.json({ success: true, message: 'Image order updated', product: formatProduct(updatedProd) });
  } catch (err: any) {
    console.error('Reorder product images error:', err);
    res.status(500).json({ error: 'Failed to reorder product images.' });
  }
});

// --- ORDERS ---
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });

    const formattedOrders = orders.map((o: any) => {
      const prod = o.product ? formatProduct(o.product) : null;
      return {
        id: o.id,
        customerName: o.customerName,
        phone: o.phone,
        email: o.email || '',
        productId: o.productId,
        productName: prod ? prod.name : 'Unknown Product',
        productPrice: prod ? prod.price : 0,
        quantity: o.quantity,
        size: o.size || 'Standard',
        status: o.status,
        notes: o.notes || '',
        createdAt: o.createdAt ? (typeof o.createdAt === 'string' ? o.createdAt : o.createdAt.toISOString()) : new Date().toISOString(),
      };
    });

    res.json(formattedOrders);
  } catch (err: any) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, phone, email, productId, quantity, size, notes } = req.body;
    if (!customerName || !phone || !productId || !quantity) {
      return res.status(400).json({ error: 'Customer name, phone, product, and quantity are required.' });
    }

    const prod = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newOrder = await prisma.order.create({
      data: {
        customerName,
        phone,
        email: email || null,
        productId,
        quantity: Number(quantity),
        size: size || 'Standard',
        status: 'Pending',
        notes: notes || null,
      },
    });

    res.status(201).json({
      id: newOrder.id,
      customerName: newOrder.customerName,
      phone: newOrder.phone,
      productId: newOrder.productId,
      productName: prod.name,
      quantity: newOrder.quantity,
      size: newOrder.size,
      status: newOrder.status,
      createdAt: newOrder.createdAt instanceof Date ? newOrder.createdAt.toISOString() : String(newOrder.createdAt),
    });
  } catch (err: any) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to save order.' });
  }
});

app.put('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Processing', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// --- GALLERY ---
app.get('/api/gallery', async (req, res) => {
  try {
    const items = await prisma.galleryItem.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(items.map(formatGalleryItem));
  } catch (err: any) {
    console.error('Get gallery error:', err);
    res.status(500).json({ error: 'Failed to retrieve gallery items.' });
  }
});

app.post(['/api/gallery', '/api/admin/gallery'], requireAuth, async (req, res) => {
  const { title, description, image, imageUrl, category, storagePublicId, altText, position, enabled } = req.body;
  try {
    if (!category) {
      return res.status(400).json({ success: false, error: 'Category is required' });
    }

    const newItem = await prisma.galleryItem.create({
      data: {
        title: title || 'NITA Photo',
        description: description || '',
        imageUrl: image || imageUrl || '',
        storagePublicId: storagePublicId || '',
        altText: altText || title || '',
        position: position !== undefined ? Number(position) : 0,
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        category,
      },
    });

    res.status(201).json(formatGalleryItem(newItem));
  } catch (err: any) {
    console.error('Create gallery item error:', err);
    if (storagePublicId || image || imageUrl) {
      deleteImageFile(storagePublicId, image || imageUrl).catch(() => {});
    }
    res.status(500).json({
      success: false,
      error: 'Image uploaded but database record could not be saved: ' + (err?.message || 'Database error'),
    });
  }
});

app.put(['/api/gallery/reorder', '/api/admin/gallery/reorder'], requireAuth, async (req, res) => {
  try {
    const { items } = req.body;
    if (Array.isArray(items)) {
      await Promise.all(
        items.map((item: any) =>
          prisma.galleryItem.update({
            where: { id: item.id },
            data: { position: Number(item.position) },
          })
        )
      );
    }
    res.json({ success: true, message: 'Gallery order updated' });
  } catch (err: any) {
    console.error('Reorder gallery items error:', err);
    res.status(500).json({ error: 'Failed to reorder gallery items.' });
  }
});

app.put(['/api/gallery/:id', '/api/admin/gallery/:id'], requireAuth, async (req, res) => {
  try {
    const { title, description, image, imageUrl, category, storagePublicId, altText, position, enabled } = req.body;
    const existing = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    const newImg = image !== undefined ? image : imageUrl;
    if (newImg && newImg !== existing.imageUrl && existing.storagePublicId) {
      await deleteImageFile(existing.storagePublicId, existing.imageUrl);
    }

    const updated = await prisma.galleryItem.update({
      where: { id: req.params.id },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        imageUrl: newImg !== undefined ? newImg : existing.imageUrl,
        category: category !== undefined ? category : existing.category,
        storagePublicId: storagePublicId !== undefined ? storagePublicId : existing.storagePublicId,
        altText: altText !== undefined ? altText : existing.altText,
        position: position !== undefined ? Number(position) : existing.position,
        enabled: enabled !== undefined ? Boolean(enabled) : existing.enabled,
      },
    });

    res.json(formatGalleryItem(updated));
  } catch (err: any) {
    console.error('Update gallery item error:', err);
    res.status(500).json({ error: 'Failed to update gallery item.' });
  }
});

app.delete(['/api/gallery/:id', '/api/admin/gallery/:id'], requireAuth, async (req, res) => {
  try {
    const existing = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
    if (existing && (existing.storagePublicId || existing.imageUrl)) {
      await deleteImageFile(existing.storagePublicId, existing.imageUrl);
    }

    const deleted = await prisma.galleryItem.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Gallery item deleted', item: formatGalleryItem(deleted) });
  } catch (err: any) {
    console.error('Delete gallery item error:', err);
    res.status(500).json({ error: 'Failed to delete gallery item.' });
  }
});

// --- IMAGE STORAGE (Admin upload and delete endpoints) ---
app.get('/api/admin/images/status', requireAuth, (req, res) => {
  const configured = isCloudinaryConfigured();
  res.json({
    success: true,
    configured,
    provider: configured ? 'cloudinary' : 'local',
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
  });
});

// Explicit handler for non-POST requests to /api/admin/images/upload
app.all('/api/admin/images/upload', (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `HTTP ${req.method} is not supported on /api/admin/images/upload. Use POST.`,
    });
  }
  next();
});

app.post('/api/admin/images/upload', requireAuth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File is too large. Maximum allowed size is 10 MB.' });
      }
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded.' });
    }

    const category = req.body.category || 'general';
    const result = await uploadImageFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      category
    );

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      publicId: result.publicId,
      provider: result.provider,
    });
  } catch (err: any) {
    console.error('Upload image error:', err);
    res.status(500).json({ success: false, error: err.message || 'Image upload failed.' });
  }
});

app.post('/api/admin/images/delete', requireAuth, async (req, res) => {
  try {
    const { publicId, imageUrl } = req.body;
    if (!publicId && !imageUrl) {
      return res.status(400).json({ success: false, error: 'publicId or imageUrl is required' });
    }

    await deleteImageFile(publicId, imageUrl);
    res.json({ success: true, message: 'Image removed from storage.' });
  } catch (err: any) {
    console.error('Delete image storage error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete image.' });
  }
});

// --- SITE IMAGES (Production, Factory, Quality & Certifications) ---
app.get('/api/site-images', async (req, res) => {
  try {
    const { section } = req.query;
    const where: any = { enabled: true };
    if (section && typeof section === 'string') {
      where.section = section.toUpperCase();
    }
    const items = await prisma.siteImage.findMany({
      where,
      orderBy: { position: 'asc' },
    });
    res.json(items);
  } catch (err: any) {
    console.error('Get site images error:', err);
    res.status(500).json({ error: 'Failed to retrieve site images.', details: err?.message });
  }
});

app.get('/api/admin/site-images', requireAuth, async (req, res) => {
  try {
    const { section } = req.query;
    const where: any = {};
    if (section && typeof section === 'string') {
      where.section = section.toUpperCase();
    }
    const items = await prisma.siteImage.findMany({
      where,
      orderBy: { position: 'asc' },
    });
    res.json(items);
  } catch (err: any) {
    console.error('Get admin site images error:', err);
    res.status(500).json({ error: 'Failed to retrieve site images.' });
  }
});

app.post('/api/admin/site-images', requireAuth, async (req, res) => {
  const { section, imageUrl, storagePublicId, altText, title, position, enabled } = req.body;
  try {
    if (!section || !imageUrl) {
      return res.status(400).json({ success: false, error: 'section and imageUrl are required.' });
    }

    const newItem = await prisma.siteImage.create({
      data: {
        section: section.toUpperCase(),
        imageUrl,
        storagePublicId: storagePublicId || '',
        altText: altText || '',
        title: title || '',
        position: position !== undefined ? Number(position) : 0,
        enabled: enabled !== undefined ? Boolean(enabled) : true,
      },
    });

    res.status(201).json(newItem);
  } catch (err: any) {
    console.error('Create site image error:', err);
    if (storagePublicId || imageUrl) {
      deleteImageFile(storagePublicId, imageUrl).catch(() => {});
    }
    res.status(500).json({
      success: false,
      error: 'Image uploaded but database record could not be saved: ' + (err?.message || 'Database error'),
    });
  }
});

app.put('/api/admin/site-images/:id', requireAuth, async (req, res) => {
  try {
    const { section, imageUrl, storagePublicId, altText, title, position, enabled } = req.body;
    const existing = await prisma.siteImage.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Site image not found' });
    }

    // Clean up old remote asset if image URL was replaced
    if (imageUrl && imageUrl !== existing.imageUrl && existing.storagePublicId) {
      await deleteImageFile(existing.storagePublicId, existing.imageUrl);
    }

    const updated = await prisma.siteImage.update({
      where: { id: req.params.id },
      data: {
        section: section ? section.toUpperCase() : existing.section,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        storagePublicId: storagePublicId !== undefined ? storagePublicId : existing.storagePublicId,
        altText: altText !== undefined ? altText : existing.altText,
        title: title !== undefined ? title : existing.title,
        position: position !== undefined ? Number(position) : existing.position,
        enabled: enabled !== undefined ? Boolean(enabled) : existing.enabled,
      },
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Update site image error:', err);
    res.status(500).json({ error: 'Failed to update site image.' });
  }
});

app.delete('/api/admin/site-images/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.siteImage.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Site image not found' });
    }

    if (existing.storagePublicId || existing.imageUrl) {
      await deleteImageFile(existing.storagePublicId, existing.imageUrl);
    }

    await prisma.siteImage.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Site image deleted successfully.' });
  } catch (err: any) {
    console.error('Delete site image error:', err);
    res.status(500).json({ error: 'Failed to delete site image.' });
  }
});

app.put('/api/admin/site-images/reorder', requireAuth, async (req, res) => {
  try {
    const { items } = req.body;
    if (Array.isArray(items)) {
      await Promise.all(
        items.map((item: any) =>
          prisma.siteImage.update({
            where: { id: item.id },
            data: { position: Number(item.position) },
          })
        )
      );
    }
    res.json({ success: true, message: 'Order updated' });
  } catch (err: any) {
    console.error('Reorder site images error:', err);
    res.status(500).json({ error: 'Failed to reorder site images.' });
  }
});

// --- MESSAGES ---
app.get('/api/messages', requireAuth, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages);
  } catch (err: any) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const newMessage = await prisma.message.create({
      data: {
        name,
        email,
        phone: phone || '',
        subject: subject || 'Website Contact Form',
        message,
        status: 'New',
      },
    });

    res.status(201).json(newMessage);
  } catch (err: any) {
    console.error('Create message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// ==========================================
// NEVER RETURN index.html FOR /api/*
// ==========================================
// 1. Explicit catch-all for any unhandled /api/* route: ALWAYS return JSON 404
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
  });
});

// 2. Centralized error handler for all /api requests: ALWAYS return JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api') || req.originalUrl?.startsWith('/api')) {
    console.error('[Centralized API Error]:', err);
    return res.status(err.status || err.statusCode || 500).json({
      success: false,
      error: err.message || 'Internal server error occurred.',
    });
  }
  next(err);
});

// --- INITIALIZE SERVER ---
async function startServer() {
  await ensureAdminExists();
  await ensureDefaultSiteImages();
  validateCloudinaryConfig();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Explicit guard before Vite middleware: ensure /api requests never hit Vite HTML fallback
    app.use((req, res, next) => {
      if (req.path.startsWith('/api') || req.url.startsWith('/api')) {
        return res.status(404).json({
          success: false,
          error: `API endpoint not found: ${req.method} ${req.url}`,
        });
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Never return index.html for API routes in production
      if (req.path.startsWith('/api')) {
        return res.status(404).json({
          success: false,
          error: `API endpoint not found: ${req.method} ${req.url}`,
        });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] NITA Foods running on http://localhost:${PORT}`);
  });
}

startServer();
