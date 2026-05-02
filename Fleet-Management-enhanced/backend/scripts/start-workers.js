require('dotenv').config();
const { Worker } = require('bullmq');
const redis = require('../src/config/redis');
const logger = require('../src/utils/logger');
const { pool } = require('../src/config/database');

// GPS Update Worker
const gpsWorker = new Worker('gps-queue', async (job) => {
  try {
    const { vehicleId, latitude, longitude } = job.data;

    // Update vehicle location in database
    await pool.query(
      'UPDATE vehicles SET latitude = $1, longitude = $2, last_ping = CURRENT_TIMESTAMP WHERE id = $3',
      [latitude, longitude, vehicleId]
    );

    logger.info(`GPS updated for vehicle: ${vehicleId}`);
    return { updated: true };
  } catch (error) {
    logger.error('GPS worker error:', error);
    throw error;
  }
}, { connection: redis });

// Alert Worker
const alertWorker = new Worker('alert-queue', async (job) => {
  try {
    const { alertId, severity } = job.data;

    logger.info(`Processing alert: ${alertId} (${severity})`);

    // Here you would integrate with notification services
    // like email, SMS, Slack, etc.

    return { processed: true };
  } catch (error) {
    logger.error('Alert worker error:', error);
    throw error;
  }
}, { connection: redis });

// Notification Worker
const notificationWorker = new Worker('notification-queue', async (job) => {
  try {
    const { userId, type, message } = job.data;

    logger.info(`Sending ${type} notification to user ${userId}`);

    // Here you would integrate with notification services

    return { sent: true };
  } catch (error) {
    logger.error('Notification worker error:', error);
    throw error;
  }
}, { connection: redis });

// Event listeners
[gpsWorker, alertWorker, notificationWorker].forEach((worker) => {
  worker.on('completed', (job) => {
    logger.info(`Job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job failed: ${job.id}`, err);
  });
});

logger.info('Workers started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down workers...');
  await Promise.all([
    gpsWorker.close(),
    alertWorker.close(),
    notificationWorker.close(),
  ]);
  process.exit(0);
});
