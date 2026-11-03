import { configuredRateStore } from './src/server/redisRateStore';
import { securityHeaders, apiBodyParser, apiErrorHandler, logApiError } from './src/server/httpSecurity';
import { InputError, contactInput, analyticsInput, orderCustomerInput, objectBody, siteImageSection, imageRecordValidation, reorderValidation } from './src/server/validation';
import { createApiRateLimits } from './src/server/rateLimits';
import { IMAGE_UPLOAD_MAX_BYTES } from './src/uploadPolicy';
import { imageExtension, uploadCategory } from './src/server/uploadValidation';
import { createAuthentication } from './src/server/auth';
import { productWriteRoutes } from './src/server/productWrites';
import { productReadRoutes } from './src/server/productReads';
import { retainMediaForReview } from './src/server/productImages';
import { productMediaRoutes } from './src/server/productMedia';
import { categoryRoutes } from './src/server/categories';
﻿import express from 'express';
import multer from 'multer';
import { prisma, requireDatabase } from './src/lib/prisma';
import { createCheckout, CheckoutError, CheckoutPriceChanged, requireCheckoutQuote } from './src/server/checkout';
import { Prisma } from '@prisma/client';
import { uploadImageFile, isCloudinaryConfigured } from './src/server/imageStorage';

export const app = express();
const { login, requireAuth } = createAuthentication(process.env.JWT_SECRET, requireDatabase);

// Middleware
app.use(securityHeaders(process.env.NODE_ENV === 'production'));
app.use(apiBodyParser);
const rateLimits = createApiRateLimits({ production: process.env.NODE_ENV === 'production', secret: process.env.JWT_SECRET!, onVercel: process.env.VERCEL === '1', store: configuredRateStore(process.env) });

// Bounded multipart admission; file contents are checked before storage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: IMAGE_UPLOAD_MAX_BYTES,
    files: 1, fields: 1, parts: 2, fieldSize: 64, fieldNameSize: 32, headerPairs: 32
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
app.post('/api/auth/login', rateLimits.login, login);

// --- ANALYTICS TRACKING ---
app.post('/api/analytics/visit', rateLimits.analytics, async (req, res) => {
  try {
    const path = analyticsInput(req.body);

    await prisma.analyticsEvent.create({
      data: {
        eventType: 'pageview',
        page: path,
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    logApiError('analytics.track.error.', err, res.locals.requestId);
    res.status(err instanceof InputError ? 400 : 503).json({ error: err instanceof InputError ? err.message : 'Could not record analytics event.' });
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
      requireDatabase().order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const pageViews: Record<string, number> = Object.create(null);
    const popularProducts: Record<string, number> = Object.create(null);

    events.forEach((ev: any) => {
      if (ev.eventType === 'pageview') {
        pageViews[ev.page] = (pageViews[ev.page] || 0) + 1;
      }
      if (ev.productId) {
        popularProducts[ev.productId] = (popularProducts[ev.productId] || 0) + 1;
      }
    });

    const totalSales = orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + Number(o.total || 0), 0);

    res.json({
      visitors: events.length || 1,
      pageViews,
      popularProducts,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalSales,
      orders,
    });
  } catch (err: any) {
    logApiError('get.analytics.error.', err, res.locals.requestId);
    res.status(500).json({ error: 'Failed to fetch analytics summary.' });
  }
});

app.use('/api/categories', categoryRoutes(requireAuth));

// --- PRODUCTS ---
app.get('/api/products/:identifier', rateLimits.productViews);
app.use('/api', productReadRoutes(requireAuth, () => prisma));

app.use('/api', productWriteRoutes(requireAuth, requireDatabase));

app.use('/api', productMediaRoutes(requireAuth, requireDatabase));

// --- ORDERS ---
app.get('/api/orders', requireAuth, async (req, res) => {
  try { res.json(await requireDatabase().order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } })); }
  catch (err) { logApiError('orders.read', err, res.locals.requestId); res.status(503).json({ error: 'Orders are temporarily unavailable.' }); }
});
app.get('/api/admin/orders/:id', requireAuth, async (req, res) => {
  try {
    const order = await requireDatabase().order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  } catch (err) { logApiError('orders.read', err, res.locals.requestId); res.status(503).json({ error: 'Unable to load order.' }); }
});
app.post('/api/orders', rateLimits.orders, async (req, res) => {
  try {
    objectBody(req.body);
    orderCustomerInput(req.body);
    requireCheckoutQuote(req.body.items);
    const order = await requireDatabase().$transaction(tx => createCheckout(tx, req.body), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    res.status(201).json(order);
  } catch (err) {
    logApiError('checkout.failed.', err, res.locals.requestId);
    res.status(err instanceof CheckoutPriceChanged ? 409 : err instanceof CheckoutError || err instanceof InputError ? 400 : 503).json({ error: err instanceof CheckoutError || err instanceof InputError ? err.message : 'Order could not be saved. Please try again.', ...(err instanceof CheckoutPriceChanged ? { priceChanges: err.changes } : {}) });
  }
});
app.put('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Processing', 'Completed', 'Cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid order status.' });
    res.json(await requireDatabase().order.update({ where: { id: req.params.id }, data: { status }, include: { items: true } }));
  } catch (err) { res.status(503).json({ error: 'Order status could not be saved.' }); }
});

// --- GALLERY ---
app.get('/api/gallery', async (req, res) => {
  try {
    const items = await prisma.galleryItem.findMany({ where: { enabled: true }, orderBy: [{ position: 'asc' }, { createdAt: 'desc' }] });
    res.json(items.filter((item: any) => item.enabled !== false).map(formatGalleryItem));
  } catch (error) { logApiError('gallery.public-read', error, res.locals.requestId); res.status(503).json({ error: 'Photographs are temporarily unavailable.' }); }
});
app.get('/api/admin/gallery', requireAuth, async (req, res) => {
  try { res.json((await prisma.galleryItem.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'desc' }] })).map(formatGalleryItem)); }
  catch (error) { logApiError('gallery.admin-read', error, res.locals.requestId); res.status(503).json({ error: 'Photographs are temporarily unavailable.' }); }
});

app.post(['/api/gallery', '/api/admin/gallery'], requireAuth, imageRecordValidation('gallery'), async (req, res) => {
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
    logApiError('create.gallery.item.error.', err, res.locals.requestId);
    if (storagePublicId || image || imageUrl) {
      retainMediaForReview(storagePublicId, image || imageUrl).catch(() => {});
    }
    res.status(500).json({
      success: false,
      error: 'The image record could not be saved. Please try again.',
    });
  }
});

app.put(['/api/gallery/reorder', '/api/admin/gallery/reorder'], requireAuth, reorderValidation, async (req, res) => {
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
    logApiError('reorder.gallery.items.error.', err, res.locals.requestId);
    res.status(500).json({ error: 'Failed to reorder gallery items.' });
  }
});

app.put(['/api/gallery/:id', '/api/admin/gallery/:id'], requireAuth, imageRecordValidation('gallery', true), async (req, res) => {
  try {
    const { title, description, image, imageUrl, category, storagePublicId, altText, position, enabled } = req.body;
    const existing = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    const newImg = image !== undefined ? image : imageUrl;
    if (newImg && newImg !== existing.imageUrl && existing.storagePublicId) {
      await retainMediaForReview(existing.storagePublicId, existing.imageUrl);
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
    logApiError('update.gallery.item.error.', err, res.locals.requestId);
    res.status(500).json({ error: 'Failed to update gallery item.' });
  }
});

app.delete(['/api/gallery/:id', '/api/admin/gallery/:id'], requireAuth, async (req, res) => {
  try {
    const existing = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
    if (existing && (existing.storagePublicId || existing.imageUrl)) {
      await retainMediaForReview(existing.storagePublicId, existing.imageUrl);
    }

    const deleted = await prisma.galleryItem.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Gallery item deleted', item: formatGalleryItem(deleted) });
  } catch (err: any) {
    logApiError('delete.gallery.item.error.', err, res.locals.requestId);
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
        return res.status(413).json({ success: false, error: 'File is too large. Maximum allowed size is 4 MB.' });
      }
      return res.status(400).json({ success: false, error: 'Invalid image upload request.' });
    } else if (err) {
      return res.status(400).json({ success: false, error: 'Invalid image upload request.' });
    }
    next();
  });
}, async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded.' });
    }

    const category = uploadCategory(req.body.category);
    imageExtension(req.file.buffer, req.file.mimetype);
    const result = await uploadImageFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      category
    );

    await retainMediaForReview(result.publicId, result.imageUrl);
    res.json({
      success: true,
      imageUrl: result.imageUrl,
      publicId: result.publicId,
      provider: result.provider,
      cleanupRequiredIfUnused: true,
    });
  } catch (err: any) {
    logApiError('upload.image.error.', err, res.locals.requestId);
    res.status(err instanceof InputError ? 400 : 503).json({ success: false, error: err instanceof InputError ? err.message : 'Image upload is temporarily unavailable.' });
  }
});

app.post('/api/admin/images/delete', requireAuth, async (req, res) => {
  try {
    const { publicId, imageUrl } = req.body;
    if (!publicId && !imageUrl) {
      return res.status(400).json({ success: false, error: 'publicId or imageUrl is required' });
    }

    await retainMediaForReview(publicId, imageUrl);
    res.json({ success: true, retained: true, cleanupRequired: true, message: 'Asset retained. Physical cleanup requires a separate reference review.' });
  } catch (err: any) {
    logApiError('delete.image.storage.error.', err, res.locals.requestId);
    res.status(500).json({ success: false, error: 'Failed to delete image.' });
  }
});

// --- SITE IMAGES (Production, Factory, Quality & Certifications) ---
app.get('/api/site-images', async (req, res) => {
  try {
    const section = siteImageSection(req.query.section);
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
    logApiError('get.site.images.error.', err, res.locals.requestId);
    res.status(err instanceof InputError ? 400 : 503).json({ error: err instanceof InputError ? err.message : 'Photographs are temporarily unavailable.' });
  }
});

app.get('/api/admin/site-images', requireAuth, async (req, res) => {
  try {
    const section = siteImageSection(req.query.section);
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
    logApiError('get.admin.site.images.error.', err, res.locals.requestId);
    res.status(err instanceof InputError ? 400 : 503).json({ error: err instanceof InputError ? err.message : 'Photographs are temporarily unavailable.' });
  }
});

app.post('/api/admin/site-images', requireAuth, imageRecordValidation('site'), async (req, res) => {
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
    logApiError('create.site.image.error.', err, res.locals.requestId);
    if (storagePublicId || imageUrl) {
      retainMediaForReview(storagePublicId, imageUrl).catch(() => {});
    }
    res.status(500).json({
      success: false,
      error: 'The image record could not be saved. Please try again.',
    });
  }
});

app.put('/api/admin/site-images/reorder', requireAuth, reorderValidation, async (req, res) => {
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
    logApiError('reorder.site.images.error.', err, res.locals.requestId);
    res.status(500).json({ error: 'Failed to reorder site images.' });
  }
});

app.put('/api/admin/site-images/:id', requireAuth, imageRecordValidation('site', true), async (req, res) => {
  try {
    const { section, imageUrl, storagePublicId, altText, title, position, enabled } = req.body;
    const existing = await prisma.siteImage.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Site image not found' });
    }

    // Clean up old remote asset if image URL was replaced
    if (imageUrl && imageUrl !== existing.imageUrl && existing.storagePublicId) {
      await retainMediaForReview(existing.storagePublicId, existing.imageUrl);
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
    logApiError('update.site.image.error.', err, res.locals.requestId);
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
      await retainMediaForReview(existing.storagePublicId, existing.imageUrl);
    }

    await prisma.siteImage.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Site image deleted successfully.' });
  } catch (err: any) {
    logApiError('delete.site.image.error.', err, res.locals.requestId);
    res.status(500).json({ error: 'Failed to delete site image.' });
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
    logApiError('get.messages.error.', err, res.locals.requestId);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

app.post('/api/messages', rateLimits.contact, async (req, res) => {
  try {
    const data = contactInput(req.body);
    await requireDatabase().message.create({ data: { ...data, status: 'New' } });
    res.status(201).json({ success: true });
  } catch (error) {
    logApiError('contact.create', error, res.locals.requestId);
    res.status(error instanceof InputError ? 400 : 503).json({ error: error instanceof InputError ? error.message : 'Your message could not be sent. Please try again.' });
  }
});

// ==========================================
// NEVER RETURN index.html FOR /api/*
// ==========================================
// 1. Explicit catch-all for any unhandled /api/* route: ALWAYS return JSON 404
app.all(['/api', '/api/*'], (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found.',
  });
});

// 2. Centralized error handler for all /api requests: ALWAYS return JSON
app.use(apiErrorHandler);

// Imported by the Vercel handler or a local runner; importing never listens.
export default app;
