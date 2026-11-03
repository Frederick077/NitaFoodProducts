import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import app from '../server';

const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(vite.middlewares);
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`[Server] Local development server listening on port ${port}.`));
