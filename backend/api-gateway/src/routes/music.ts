import { Router, Request, Response } from 'express';
import { validateTrackMetadata } from '../middleware/validateTrackMetadata';
import { cacheGet, cacheSet, cacheDel, TTL } from '../services/cacheService';

export const musicRoutes = Router();

// POST /api/v1/music - Create a new track (with validation + sanitization)
musicRoutes.post('/', validateTrackMetadata, async (req: Request, res: Response) => {
  // Invalidate top-tracks cache when a new track is added
  await cacheDel('top_tracks');
  res.status(201).json({
    success: true,
    message: 'Track metadata validated and accepted',
    data: req.body,
  });
});

// GET /api/v1/music - List tracks (cached as top_tracks)
musicRoutes.get('/', async (_req: Request, res: Response) => {
  const cached = await cacheGet<{ success: boolean; data: unknown[] }>('top_tracks');
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    res.json(cached);
    return;
  }

  const result = { success: true, data: [] as unknown[] };
  await cacheSet('top_tracks', result, TTL.TOP_TRACKS);
  res.setHeader('X-Cache', 'MISS');
  res.json(result);
});

// GET /api/v1/music/:id - Get a single track (cached per id)
musicRoutes.get('/:id', async (req: Request, res: Response) => {
  const key = `track:${req.params.id}`;
  const cached = await cacheGet<{ success: boolean; data: { id: string } }>(key);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    res.json(cached);
    return;
  }

  const result = { success: true, data: { id: req.params.id } };
  await cacheSet(key, result, TTL.TOP_TRACKS);
  res.setHeader('X-Cache', 'MISS');
  res.json(result);
});
