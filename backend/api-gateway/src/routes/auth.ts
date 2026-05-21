import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { Keypair } from 'stellar-sdk';
import { validate } from '../middleware/validate';
import { signToken } from '../middleware/auth';

export const authRoutes = Router();

/**
 * POST /api/v1/auth/login
 *
 * Authenticates a user by verifying a Stellar keypair signature.
 * The client signs the challenge message with their Stellar secret key
 * and sends the public key + signature for verification.
 *
 * Body: { walletAddress, signature, message, role }
 */
authRoutes.post(
  '/login',
  validate([
    body('walletAddress').notEmpty().trim().withMessage('walletAddress is required'),
    body('signature').notEmpty().trim().withMessage('signature is required'),
    body('message').notEmpty().trim().withMessage('message is required'),
    body('role').isIn(['artist', 'fan']).withMessage('role must be artist or fan'),
  ]),
  (req: Request, res: Response) => {
    const { walletAddress, signature, message, role } = req.body as {
      walletAddress: string;
      signature: string;
      message: string;
      role: 'artist' | 'fan';
    };

    try {
      const keypair = Keypair.fromPublicKey(walletAddress);
      const isValid = keypair.verify(Buffer.from(message), Buffer.from(signature, 'base64'));
      if (!isValid) {
        res.status(401).json({ error: 'Signature verification failed' });
        return;
      }
    } catch {
      res.status(400).json({ error: 'Invalid wallet address or signature format' });
      return;
    }

    // In production, look up the user UUID from the DB by walletAddress.
    // For now we use the walletAddress as the subject.
    const token = signToken({ sub: walletAddress, walletAddress, role });
    res.json({ token, walletAddress, role });
  }
);

/**
 * GET /api/v1/auth/challenge
 *
 * Returns a time-stamped challenge string the client must sign.
 */
authRoutes.get('/challenge', (_req: Request, res: Response) => {
  const challenge = `MusicStreamX login: ${Date.now()}`;
  res.json({ challenge });
});
