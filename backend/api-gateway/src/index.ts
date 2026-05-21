import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import multer from 'multer';

import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { connectRedis } from './config/redis';
import { connectDatabase } from './config/database';
import { musicRoutes } from './routes/music';
import { artistRoutes } from './routes/artists';
import { fanRoutes } from './routes/fans';
import { nftRoutes } from './routes/nft';
import { streamingRoutes } from './routes/streaming';
import { liveEventsRoutes } from './routes/live-events';
import { governanceRoutes } from './routes/governance';
import { audioRoutes } from './routes/audio';
import { initializeSocketHandlers } from './services/socketService';
import { ipfsService } from './services/ipfsService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "blob:"],
    },
  },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3100',
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// Serve static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      redis: 'connected',
      stellar: 'connected',
      ipfs: 'connected',
    },
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API documentation endpoint
app.get('/api/v1/docs', (_req, res) => {
  res.json({
    title: 'MusicStreamX API Gateway',
    version: '1.0.0',
    description: 'Main API gateway for MusicStreamX music streaming platform',
    endpoints: {
      music: '/api/v1/music',
      artists: '/api/v1/artists',
      fans: '/api/v1/fans',
      nft: '/api/v1/nft',
      streaming: '/api/v1/streaming',
      liveEvents: '/api/v1/live-events',
      governance: '/api/v1/governance',
    },
    websocket: '/socket.io',
    fileUpload: '/api/v1/upload',
  });
});

// File upload endpoint
app.post('/api/v1/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to IPFS
    const ipfsHash = await ipfsService.uploadFile(req.file.path);
    
    // Clean up temporary file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      ipfsHash,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    logger.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// API routes
app.use('/api/v1/music', musicRoutes);
app.use('/api/v1/audio', audioRoutes);
app.use('/api/v1/artists', artistRoutes);
app.use('/api/v1/fans', fanRoutes);
app.use('/api/v1/nft', nftRoutes);
app.use('/api/v1/streaming', streamingRoutes);
app.use('/api/v1/live-events', liveEventsRoutes);
app.use('/api/v1/governance', governanceRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Create Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3100',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Initialize IPFS service
    await ipfsService.initialize();
    logger.info('IPFS service initialized successfully');

    // Start server
    server.listen(PORT, () => {
      logger.info(`🎵 MusicStreamX API Gateway running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/v1/docs`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🔌 Socket.IO: Real-time connections enabled`);
      logger.info(`📁 File Upload: /api/v1/upload`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

// Export for testing
export { app, server, io };
