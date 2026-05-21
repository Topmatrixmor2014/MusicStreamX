import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface StreamCountUpdate {
  trackId: string;
  streamCount: number;
}

interface RoyaltyUpdate {
  trackId: string;
  artistId: string;
  amountXlm: number;
  totalEarnings: number;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, { transports: ['websocket', 'polling'] });
  }
  return socket;
}

/**
 * Subscribes to real-time stream count and royalty updates for a track.
 * Returns the latest stream count and royalty info pushed by the server.
 */
export function useStreamCount(trackId: string | null | undefined) {
  const [streamCount, setStreamCount] = useState<number | null>(null);
  const [royalty, setRoyalty] = useState<RoyaltyUpdate | null>(null);

  useEffect(() => {
    if (!trackId) return;

    const s = getSocket();
    s.emit('subscribe:track', trackId);

    const onCount = (update: StreamCountUpdate) => {
      if (update.trackId === trackId) setStreamCount(update.streamCount);
    };
    const onRoyalty = (update: RoyaltyUpdate) => {
      if (update.trackId === trackId) setRoyalty(update);
    };

    s.on('stream:count', onCount);
    s.on('royalty:update', onRoyalty);

    return () => {
      s.emit('unsubscribe:track', trackId);
      s.off('stream:count', onCount);
      s.off('royalty:update', onRoyalty);
    };
  }, [trackId]);

  return { streamCount, royalty };
}
