import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { validateTrackMetadata } from '../middleware/validateTrackMetadata';
import { cacheGet, cacheSet, cacheDel, TTL } from '../services/cacheService';
import { ipfsService } from '../services/ipfsService';

export const musicRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

/**
 * Registers a track on the Stellar blockchain (stub — replace with real contract call).
 */
export async function registerTrackOnChain(params: {
  ipfsHash: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  artistAddress: string;
}): Promise<string> {
  // TODO: call Soroban contract; return real tx hash
  return `tx_${params.ipfsHash.slice(0, 16)}_${Date.now()}`;
}

// POST /api/v1/music/upload - upload audio file to IPFS and register on-chain
musicRoutes.post('/upload', (req: Request, res: Response, next: NextFunction) => {
  upload.single('audio')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
}, async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file provided' });
    return;
  }
  const { title, artist, genre, duration, artistAddress } = req.body;
  if (!title || !artist || !genre || !artistAddress) {
    res.status(400).json({ error: 'Missing required fields: title, artist, genre, artistAddress' });
    return;
  }
  const dur = parseInt(duration, 10);
  if (!dur || dur <= 0) {
    res.status(400).json({ error: 'Invalid duration: must be a positive integer' });
    return;
  }
  try {
    const tmpPath = `/tmp/upload_${Date.now()}`;
    require('fs').writeFileSync(tmpPath, req.file.buffer);
    const ipfsHash = await ipfsService.uploadFile(tmpPath);
    require('fs').unlinkSync(tmpPath);
    const ipfsUrl = ipfsService.getGatewayUrl(ipfsHash);
    const txHash = await registerTrackOnChain({ ipfsHash, title, artist, genre, duration: dur, artistAddress });
    res.status(201).json({ success: true, data: { ipfsHash, ipfsUrl, txHash, title, artist, genre, duration: dur } });
  } catch {
    res.status(500).json({ error: 'Upload failed' });
  }
});

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
