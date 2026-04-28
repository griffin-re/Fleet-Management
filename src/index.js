require('dotenv').config();
const { server, wsManager } = require('./app');
const config = require('./config');
const { createTables } = require('./utils/setupDb');
const logger = require('./utils/logger');
const redisModule = require('./config/redis');

// Make wsManager available globally for workers
global.wsManager = wsManager;

const PORT = config.PORT;

async function startServer() {
  try {
    // Optionally skip Redis if not configured
    if (process.env.DISABLE_REDIS === 'true') {
      console.log('⚠️ Redis disabled via DISABLE_REDIS=true. Skipping Redis connection.');
    } else {
      console.log('🔄 Connecting to Redis...');
    }

    const redisConnection = await redisModule.waitForRedis();

    if (!redisConnection) {
      console.warn('⚠️ Redis not initialized. Skipping queue and worker startup.');
    } else {
      console.log('✅ Redis connected and ready');
    }

    // Try to create database tables (will skip gracefully if DB not available)
    await createTables();

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    // Initialize queues and workers only when Redis is available
    if (redisConnection) {
      await initializeWorkers(redisConnection);
    } else {
      logger.info('Worker initialization skipped because Redis is disabled.');
    }
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

async function initializeWorkers(redisConnection) {
  try {
    const { initializeQueues } = require('./config/queue');

    const queues = initializeQueues(redisConnection);

    const createGpsWorker = require('./workers/gpsWorker');
    const createAlertWorker = require('./workers/alertWorker');
    const createNotificationWorker = require('./workers/notificationWorker');

    createGpsWorker(redisConnection);
    createAlertWorker(redisConnection);
    createNotificationWorker(redisConnection);

    logger.info('Workers initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize workers', { error: error.message });
    throw error;
  }
}

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: reason instanceof Error ? reason.message : reason });
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

async function main() {
  await startServer();
}

main();