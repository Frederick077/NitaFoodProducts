import { logApiError } from './httpSecurity';
import { InputError } from './validation';
import { Router, type RequestHandler } from 'express';
import { formatProduct } from './formatProduct';
import { matchesProductSearch } from '../catalog';

// Inject read access; importing this router never starts the application or connects a database.
export function productReadRoutes(requireAuth: RequestHandler, database: () => any) {
 const router = Router();
router.get('/products', async (req, res) => {
  try {
    const { category, categoryId, featured, search } = req.query;
    for (const value of [category, categoryId, featured, search]) if (value !== undefined && (typeof value !== 'string' || value.length > 200)) throw new InputError('Invalid product filter.');

    const where: any = { publicationStatus: 'PUBLISHED' };
    if (featured === 'true') {
      where.isFeatured = true;
    }
    if (categoryId) where.categoryId = String(categoryId);
    else if (category && category !== 'All') {
      where.category = { name: String(category) };
    }

    const products = await database().product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    let formatted = products.filter((p: any) => !p.publicationStatus || p.publicationStatus === 'PUBLISHED').map(formatProduct);

    if (search) {
      const q = String(search).toLowerCase();
      formatted = formatted.filter((p: any) => matchesProductSearch(p, q));
    }

    res.json(formatted);
  } catch (err: any) {
    logApiError('get.products.error.', err, res.locals.requestId);
    res.status(err instanceof InputError ? 400 : 503).json({ error: err instanceof InputError ? err.message : 'Products are temporarily unavailable.' });
  }
});

// Alias
router.get('/admin/products', requireAuth, async (req, res) => {
  try {
    const products = await database().product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(products.map(formatProduct));
  } catch (err: any) {
    logApiError('admin.get.products.error.', err, res.locals.requestId);
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

router.get('/products/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    if (typeof identifier !== 'string' || !identifier || identifier.length > 200) throw new InputError('Invalid product identifier.');
    let product = await database().product.findUnique({
      where: { id: identifier },
    });

    if (!product) {
      product = await database().product.findUnique({
        where: { slug: identifier },
      });
    }

    if (!product || (product.publicationStatus && product.publicationStatus !== 'PUBLISHED')) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Record product view event
    if (res.locals.analyticsAllowed !== false) database().analyticsEvent
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
    logApiError('get.product.by.identifier.error.', err, res.locals.requestId);
    res.status(err instanceof InputError ? 400 : 503).json({ error: err instanceof InputError ? err.message : 'Product details are temporarily unavailable.' });
  }
});

router.get('/admin/products/:id/preview', requireAuth, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const product = await database().product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(formatProduct(product));
  } catch { res.status(503).json({ error: 'Preview unavailable.' }); }
});


 return router;
}
