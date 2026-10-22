import { Router, type RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { requireDatabase } from '../lib/prisma';

export function categoryRoutes(requireAuth: RequestHandler, database = requireDatabase) {
  const router = Router();
  const errorResponse = (res: Parameters<RequestHandler>[1], error: unknown) => {
    const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : '';
    if (code === 'P2002') return res.status(409).json({ error: 'A category with this name already exists.' });
    if (code === 'P2003') return res.status(409).json({ error: 'Products use this category. Reassign them before deleting it.' });
    if (code === 'P2025') return res.status(404).json({ error: 'Category not found.' });
    return res.status(503).json({ error: 'Categories are unavailable. Check the database connection and category migration.' });
  };
  const parseName = (value: unknown) => typeof value === 'string' ? value.trim() : '';
  router.get('/', async (_req, res) => {
    try {
      res.json(await database().category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } }));
    } catch (error) { errorResponse(res, error); }
  });
  router.post('/', requireAuth, async (req, res) => {
    const name = parseName(req.body.name);
    if (!name || name === 'All' || name.length > 120) return res.status(400).json({ error: 'Use 1-120 characters. "All" is reserved for the shop filter.' });
    const slug = (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category') + '-' + crypto.randomUUID();
    try {
      res.status(201).json(await database().category.create({ data: { name, slug } }));
    } catch (error) { errorResponse(res, error); }
  });
  router.put('/:id', requireAuth, async (req, res) => {
    const name = parseName(req.body.name);
    if (!name || name === 'All' || name.length > 120) return res.status(400).json({ error: 'Use 1-120 characters. "All" is reserved for the shop filter.' });
    try {
      // Keep the slug and ID stable when changing a category's display name.
      res.json(await database().category.update({ where: { id: req.params.id }, data: { name } }));
    } catch (error) { errorResponse(res, error); }
  });
  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      // The RESTRICT foreign key also guards against concurrent product assignments.
      await database().category.delete({ where: { id: req.params.id } });
      res.status(204).end();
    } catch (error) { errorResponse(res, error); }
  });
  return router;
}
