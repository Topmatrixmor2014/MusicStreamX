import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export interface StreamCountUpdate {
  trackId: string;
  streamCount: number;
}

export interface RoyaltyUpdate {
  trackId: string;
  artistId: string;
  amountXlm: number;
  totalEarnings: number;
}

let ioInstance: SocketIOServer | null = null;

export function initializeSocketHandlers(io: SocketIOServer): void {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Client subscribes to a specific track's live updates
    socket.on('subscribe:track', (trackId: string) => {
      if (typeof trackId === 'string' && trackId.length <= 128) {
        socket.join(`track:${trackId}`);
        logger.info(`Socket ${socket.id} subscribed to track:${trackId}`);
      }
    });

    socket.on('unsubscribe:track', (trackId: string) => {
      socket.leave(`track:${trackId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}

/**
 * Broadcast a stream count update to all clients subscribed to a track room.
 * Called from the streaming route after recording a play event.
 */
export function emitStreamCountUpdate(update: StreamCountUpdate): void {
  if (!ioInstance) return;
  ioInstance.to(`track:${update.trackId}`).emit('stream:count', update);
  logger.info(`Emitted stream count update for track ${update.trackId}: ${update.streamCount}`);
}

/**
 * Broadcast a royalty update to all clients subscribed to a track room.
 */
export function emitRoyaltyUpdate(update: RoyaltyUpdate): void {
  if (!ioInstance) return;
  ioInstance.to(`track:${update.trackId}`).emit('royalty:update', update);
  logger.info(`Emitted royalty update for track ${update.trackId}: ${update.amountXlm} XLM`);
}
