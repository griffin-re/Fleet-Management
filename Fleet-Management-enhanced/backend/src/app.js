const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler, asyncHandler } = require('./middleware/error');
const { initializeDatabase } = require('./config/database');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth');
const vehiclesRoutes = require('./routes/vehicles');
const convoysRoutes = require('./routes/convoys');
const alertsRoutes = require('./routes/alerts');
const messagesRoutes = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// FIXED: trust proxy for correct IP rate-limiting behind Nginx/load balancer
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile/curl) or matching allowed origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  // FIXED: return JSON error instead of HTML
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
});
app.use(limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many login attempts, please try again in 15 minutes.' });
  },
});

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// Health check
app.get('/health', asyncHandler(async (req, res) => {
  const { pool } = require('./config/database');
  const redis = require('./config/redis');

  const checks = { database: 'disconnected', redis: 'disconnected' };

  try {
    await pool.query('SELECT 1');
    checks.database = 'connected';
  } catch (_) {}

  try {
    const pong = await redis.ping();
    checks.redis = pong === 'PONG' ? 'connected' : 'error';
  } catch (_) {}

  const healthy = checks.database === 'connected';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    ...checks,
    uptime: process.uptime(),
  });
}));

// API v1 Routes — FIXED: apply authLimiter to auth routes only
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/vehicles', vehiclesRoutes);
app.use('/api/v1/convoys', convoysRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error handler (must be last)
app.use(errorHandler);

// Server startup
const PORT = parseInt(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await initializeDatabase();
    logger.info('Database initialized');

    const server = require('http').createServer(app);
    const { Server } = require('socket.io');

    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
      // FIXED: set sensible ping settings
      pingTimeout: 10000,
      pingInterval: 25000,
    });

    // Socket.IO authentication middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      try {
        const jwt = require('jsonwebtoken');
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
      } catch (err) {
        next(new Error('Invalid or expired token'));
      }
    });

    io.on('connection', (socket) => {
      logger.info(`[Socket] User connected: ${socket.user.email} (${socket.id})`);

      // Join user-specific room for targeted messages
      socket.join(`user:${socket.user.id}`);

      socket.on('disconnect', (reason) => {
        logger.info(`[Socket] User disconnected: ${socket.user.email} — ${reason}`);
      });

      // FIXED: validate/sanitize broadcast data before re-emitting
      socket.on('convoy:update', (data) => {
        if (data && typeof data === 'object') {
          io.emit('convoy:update', data);
        }
      });

      socket.on('alert:new', (data) => {
        if (data && typeof data === 'object') {
          io.emit('alert:new', data);
        }
      });

      socket.on('vehicle:update', (data) => {
        if (data && typeof data === 'object') {
          io.emit('vehicle:update', data);
        }
      });
    });

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Allowed origins: ${allowedOrigins.join(', ')}`);
    });

    // FIXED: store io on app for use in controllers
    app.locals.io = io;

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        const { pool } = require('./config/database');
        await pool.end();
        logger.info('Database pool closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
