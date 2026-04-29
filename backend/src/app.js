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

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Health check
app.get('/health', asyncHandler(async (req, res) => {
  const { pool } = require('./config/database');
  const redis = require('./config/redis');

  try {
    await pool.query('SELECT 1');
    const redisPing = await redis.ping();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: redisPing === 'PONG' ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({ status: 'error', error: error.message });
  }
}));

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vehicles', vehiclesRoutes);
app.use('/api/v1/convoys', convoysRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');

    // Setup Socket.IO
    const server = require('http').createServer(app);
    const { Server } = require('socket.io');
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
    });

    // Socket.IO middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      
      try {
        const jwt = require('jsonwebtoken');
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    // Socket.IO events
    io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.user.email}`);

      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.user.email}`);
      });

      // Real-time event handlers
      socket.on('convoy:update', (data) => {
        io.emit('convoy:update', data);
      });

      socket.on('alert:new', (data) => {
        io.emit('alert:new', data);
      });

      socket.on('vehicle:update', (data) => {
        io.emit('vehicle:update', data);
      });
    });

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });

    // Store io instance for workers
    app.locals.io = io;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
