import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import { validate } from '../middleware/validate';
import { cacheGet, cacheSet, TTL } from '../services/cacheService';

export const searchRoutes = Router();

type SortBy = 'popularity' | 'release_date' | 'title';

interface TrackResult {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration_secs: number;
  stream_count: number;
  release_date: string;
  audio_cid: string;
  cover_cid: string | null;
}

/**
 * GET /api/v1/search/tracks
 *
 * Query params:
 *   q          - full-text search query (title, genre)
 *   genre      - filter by genre (case-insensitive)
 *   artist_id  - filter by artist UUID
 *   sort_by    - popularity | release_date | title  (default: popularity)
 *   order      - asc | desc  (default: desc)
 *   page       - page number (default: 1)
 *   limit      - results per page (default: 20, max: 100)
 */
searchRoutes.get(
  '/tracks',
  validate([
    query('q').optional().trim().isLength({ max: 200 }),
    query('genre').optional().trim().isLength({ max: 50 }),
    query('artist_id').optional().isUUID().withMessage('artist_id must be a valid UUID'),
    query('sort_by').optional().isIn(['popularity', 'release_date', 'title']),
    query('order').optional().isIn(['asc', 'desc']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  async (req: Request, res: Response) => {
    const {
      q = '',
      genre,
      artist_id,
      sort_by = 'popularity',
      order = 'desc',
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build a deterministic cache key from all query params
    const cacheKey = `search:tracks:${JSON.stringify({ q, genre, artist_id, sort_by, order, pageNum, limitNum })}`;
    const cached = await cacheGet<{ success: boolean; data: TrackResult[]; meta: object }>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    // Build parameterised SQL
    const params: (string | number)[] = [];
    const conditions: string[] = ['t.is_published = TRUE'];

    if (q) {
      params.push(q);
      conditions.push(`t.search_vector @@ plainto_tsquery('english', $${params.length})`);
    }
    if (genre) {
      params.push(genre.toLowerCase());
      conditions.push(`LOWER(t.genre) = $${params.length}`);
    }
    if (artist_id) {
      params.push(artist_id);
      conditions.push(`t.artist_id = $${params.length}`);
    }

    const sortColumn: Record<SortBy, string> = {
      popularity: 't.stream_count',
      release_date: 't.release_date',
      title: 't.title',
    };
    const orderClause = `${sortColumn[sort_by as SortBy] ?? 't.stream_count'} ${order === 'asc' ? 'ASC' : 'DESC'}`;

    params.push(limitNum, offset);
    const sql = `
      SELECT
        t.id, t.title, a.name AS artist, t.genre,
        t.duration_secs, t.stream_count, t.release_date,
        t.audio_cid, t.cover_cid
      FROM tracks t
      JOIN artists a ON a.id = t.artist_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderClause}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    // Import pool lazily to avoid circular deps at module load time
    const { pool } = await import('../config/database');
    const { rows } = await pool.query<TrackResult>(sql, params);

    // Count query for pagination metadata
    const countParams = params.slice(0, params.length - 2);
    const countSql = `
      SELECT COUNT(*) AS total
      FROM tracks t
      JOIN artists a ON a.id = t.artist_id
      WHERE ${conditions.join(' AND ')}
    `;
    const { rows: countRows } = await pool.query<{ total: string }>(countSql, countParams);
    const total = parseInt(countRows[0]?.total ?? '0', 10);

    const result = {
      success: true,
      data: rows,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };

    await cacheSet(cacheKey, result, TTL.TOP_TRACKS);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  }
);
