const { Queue, QueueScheduler } = require('bullmq');
const redis = require('./redis');
require('dotenv').config();

let gpsQueue;
let alertQueue;
let notificationQueue;

const wireQueueErrorHandlers = (queue, name) => {
  queue.on('error', (err) => {
    console.error(`[${name}] Error:`, err.message);
  });
};

const initializeQueues = (redisConnection) => {
  if (!redisConnection || redisConnection.status !== 'ready') {
    throw new Error('Redis connection is not ready. Cannot initialize queues.');
  }

  const queueConfig = {
    connection: redisConnection,
  };

  gpsQueue = new Queue('gps', {
    ...queueConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  alertQueue = new Queue('alerts', {
    ...queueConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  notificationQueue = new Queue('notifications', {
    ...queueConfig,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  wireQueueErrorHandlers(gpsQueue, 'GPS Queue');
  wireQueueErrorHandlers(alertQueue, 'Alert Queue');
  wireQueueErrorHandlers(notificationQueue, 'Notification Queue');

  // Explicitly create QueueScheduler instances with connections to avoid deprecation warnings
  const gpsScheduler = new QueueScheduler('gps', { connection: redisConnection });
  const alertScheduler = new QueueScheduler('alerts', { connection: redisConnection });
  const notificationScheduler = new QueueScheduler('notifications', { connection: redisConnection });

  console.info('✅ Queues initialized successfully');

  return { gpsQueue, alertQueue, notificationQueue, gpsScheduler, alertScheduler, notificationScheduler };
};

module.exports = {
  initializeQueues,
  get gpsQueue() { return gpsQueue; },
  get alertQueue() { return alertQueue; },
  get notificationQueue() { return notificationQueue; }
};
