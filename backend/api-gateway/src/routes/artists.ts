import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { cacheGet, cacheSet, cacheDel, TTL } from '../services/cacheService';

export const artistRoutes = Router();

// GET /api/v1/artists
artistRoutes.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  (_req: Request, res: Response) => {
    res.json({ artists: [] });
  }
);

// GET /api/v1/artists/:id/analytics — royalty analytics dashboard data
artistRoutes.get(
  '/:id/analytics',
  validate([param('id').isUUID().withMessage('id must be a valid UUID')]),
  async (req: Request, res: Response) => {
    const key = `artist_analytics:${req.params.id}`;
    const cached = await cacheGet<object>(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    // Generate 30-day demo data; replace with real DB queries in production
    const today = new Date();
    const streamHistory = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      return {
        date: d.toISOString().slice(0, 10),
        streams: Math.floor(Math.random() * 500) + 50,
      };
    });
    const earningsHistory = streamHistory.map((p) => ({
      date: p.date,
      earnings: parseFloat((p.streams * 0.004).toFixed(4)),
    }));
    const totalStreams = streamHistory.reduce((s, p) => s + p.streams, 0);
    const totalEarnings = parseFloat(earningsHistory.reduce((s, p) => s + p.earnings, 0).toFixed(4));

    const result = {
      artistId: req.params.id,
      totalStreams,
      totalEarnings,
      streamHistory,
      earningsHistory,
      topTracks: [
        { id: '1', title: 'Track Alpha', streams: 1200, earnings: 4.8 },
        { id: '2', title: 'Track Beta', streams: 980, earnings: 3.92 },
        { id: '3', title: 'Track Gamma', streams: 750, earnings: 3.0 },
        { id: '4', title: 'Track Delta', streams: 620, earnings: 2.48 },
        { id: '5', title: 'Track Epsilon', streams: 410, earnings: 1.64 },
      ],
      geoDistribution: [
        { country: 'United States', listeners: 4200, percentage: 35.0 },
        { country: 'United Kingdom', listeners: 1800, percentage: 15.0 },
        { country: 'Germany', listeners: 1200, percentage: 10.0 },
        { country: 'Brazil', listeners: 960, percentage: 8.0 },
        { country: 'Japan', listeners: 840, percentage: 7.0 },
        { country: 'Other', listeners: 3000, percentage: 25.0 },
      ],
    };

    await cacheSet(key, result, TTL.ARTIST_PROFILE);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  }
);

// GET /api/v1/artists/:id
artistRoutes.get(
  '/:id',
  validate([param('id').isUUID().withMessage('id must be a valid UUID')]),
  async (req: Request, res: Response) => {
    const key = `artist_profile:${req.params.id}`;
    const cached = await cacheGet<{ id: string }>(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    const result = { id: req.params.id };
    await cacheSet(key, result, TTL.ARTIST_PROFILE);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  }
);

// POST /api/v1/artists - register artist
artistRoutes.post(
  '/',
  validate([
    body('name').notEmpty().trim().isLength({ max: 100 }).withMessage('name is required (max 100 chars)'),
    body('email').isEmail().normalizeEmail().withMessage('valid email is required'),
    body('walletAddress').notEmpty().trim().withMessage('walletAddress is required'),
    body('bio').optional().trim().isLength({ max: 1000 }),
  ]),
  (req: Request, res: Response) => {
    res.status(201).json({ message: 'Artist registered', data: req.body });
  }
);

// PUT /api/v1/artists/:id — invalidate profile cache on update
artistRoutes.put(
  '/:id',
  validate([
    param('id').isUUID().withMessage('id must be a valid UUID'),
    body('name').optional().trim().isLength({ max: 100 }),
    body('bio').optional().trim().isLength({ max: 1000 }),
  ]),
  async (req: Request, res: Response) => {
    await cacheDel(`artist_profile:${req.params.id}`);
    res.json({ message: 'Artist updated', id: req.params.id });
  }
);
