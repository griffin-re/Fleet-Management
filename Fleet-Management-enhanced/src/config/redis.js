const Redis = require('ioredis');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const redisUrl = process.env.REDIS_URL;
const disableRedis = process.env.DISABLE_REDIS === 'true';
let redis = null;
let redisReadyPromise = null;

const createRedisClient = async () => {
  if (disableRedis) {
    console.warn('⚠️ Skipping Redis because DISABLE_REDIS=true. Redis features are disabled.');
    return null;
  }

  if (!redisUrl) {
    console.warn('⚠️ Skipping Redis: REDIS_URL is not configured. Redis features are disabled.');
    return null;
  }

  redis = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy: (times) => {
      if (times >= 3) {
        return null;
      }
      return Math.min(times * 100, 2000);
    },
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
  });

  redis.on('connect', () => {
    console.log(`✅ Redis connected to ${redisUrl}`);
  });

  redis.on('ready', () => {
    console.log('✅ Redis ready');
  });

  try {
    redisReadyPromise = redis.connect();
    await redisReadyPromise;
    return redis;
  } catch (error) {
    console.error('⚠️ Redis connection failed:', error.message);
    try {
      await redis.disconnect();
    } catch (disconnectError) {
      console.warn('⚠️ Redis disconnect after failure failed:', disconnectError.message);
    }
    redis = null;
    return null;
  }
};

const waitForRedis = async () => {
  if (!redis) {
    return await createRedisClient();
  }

  try {
    await redisReadyPromise;
    return redis;
  } catch (err) {
    console.error('⚠️ Redis startup failed:', err.message);
    return null;
  }
};

module.exports = { redis, waitForRedis, disabled: disableRedis, redisUrl };
