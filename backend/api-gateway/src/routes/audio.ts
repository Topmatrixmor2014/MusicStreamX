import { Router, Request, Response } from 'express';
import { param } from 'express-validator';
import { validate } from '../middleware/validate';
import { ipfsService } from '../services/ipfsService';
import { logger } from '../utils/logger';

export const audioRoutes = Router();

/**
 * GET /api/v1/audio/:cid
 *
 * Proxies IPFS audio content with HTTP range request support so browsers
 * can seek within audio files without downloading the entire file.
 *
 * The CID is validated to contain only base58/base32 characters.
 */
audioRoutes.get(
  '/:cid',
  validate([
    param('cid')
      .matches(/^[a-zA-Z0-9]+$/)
      .isLength({ min: 10, max: 128 })
      .withMessage('cid must be a valid IPFS CID'),
  ]),
  async (req: Request, res: Response) => {
    const { cid } = req.params;

    try {
      const fileBuffer = await ipfsService.getFile(cid);
      const totalSize = fileBuffer.length;

      const rangeHeader = req.headers.range;

      if (rangeHeader) {
        // Parse "bytes=start-end"
        const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : totalSize - 1;

        if (start >= totalSize || end >= totalSize || start > end) {
          res.status(416).set('Content-Range', `bytes */${totalSize}`).end();
          return;
        }

        const chunkSize = end - start + 1;
        const chunk = fileBuffer.slice(start, end + 1);

        res.status(206).set({
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
        });
        res.end(chunk);
      } else {
        // Full file response
        res.status(200).set({
          'Content-Length': totalSize,
          'Content-Type': 'audio/mpeg',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=86400',
        });
        res.end(fileBuffer);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Audio streaming error for CID ${cid}: ${message}`);
      res.status(502).json({ error: 'Failed to retrieve audio from IPFS', detail: message });
    }
  }
);
