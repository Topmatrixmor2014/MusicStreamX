import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import { emitStreamCountUpdate, emitRoyaltyUpdate } from '../services/socketService';

export const streamingRoutes = Router();

// GET /api/v1/streaming/:trackId - get stream URL
streamingRoutes.get(
  '/:trackId',
  validate([param('trackId').isUUID().withMessage('trackId must be a valid UUID')]),
  (req: Request, res: Response) => {
    res.json({ streamUrl: `https://ipfs.io/ipfs/placeholder-${req.params.trackId}` });
  }
);

// POST /api/v1/streaming/play - record a play event and push real-time updates
streamingRoutes.post(
  '/play',
  validate([
    body('trackId').isUUID().withMessage('trackId must be a valid UUID'),
    body('fanId').isUUID().withMessage('fanId must be a valid UUID'),
    body('durationPlayed').isInt({ min: 0 }).withMessage('durationPlayed must be a non-negative integer'),
  ]),
  async (req: Request, res: Response) => {
    const { trackId, fanId, durationPlayed } = req.body as {
      trackId: string;
      fanId: string;
      durationPlayed: number;
    };

    // TODO: persist play event to DB and fetch real counts
    // Placeholder: increment a mock counter and emit updates
    const mockStreamCount = Math.floor(Math.random() * 10000) + 1;
    const royaltyPerPlay = 0.004; // XLM per play

    // Emit real-time stream count update to all subscribers of this track
    emitStreamCountUpdate({ trackId, streamCount: mockStreamCount });

    // Emit royalty update (in production, derive artistId from DB)
    emitRoyaltyUpdate({
      trackId,
      artistId: 'placeholder-artist-id',
      amountXlm: royaltyPerPlay,
      totalEarnings: mockStreamCount * royaltyPerPlay,
    });

    res.status(201).json({
      message: 'Play recorded',
      data: { trackId, fanId, durationPlayed, streamCount: mockStreamCount },
    });
  }
);
