require('dotenv').config();
const logger = require('../src/utils/logger');

// Individual workers for separate processes

const fs = require('fs');
const path = require('path');

// GPS Worker
if (!fs.existsSync(path.join(__dirname, '../src/workers/gpsWorker.js'))) {
  fs.writeFileSync(path.join(__dirname, '../src/workers/gpsWorker.js'), `
require('dotenv').config();
const { Worker } = require('bullmq');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const { pool } = require('../config/database');

const worker = new Worker('gps-queue', async (job) => {
  const { vehicleId, latitude, longitude } = job.data;
  await pool.query(
    'UPDATE vehicles SET latitude = \\$1, longitude = \\$2, last_ping = CURRENT_TIMESTAMP WHERE id = \\$3',
    [latitude, longitude, vehicleId]
  );
  logger.info(\`GPS updated: \\${vehicleId}\`);
}, { connection: redis });

worker.on('completed', (job) => logger.info(\`GPS job completed: \\${job.id}\`));
worker.on('failed', (job, err) => logger.error(\`GPS job failed: \\${job.id}\`, err));

process.on('SIGTERM', async () => {
  logger.info('GPS worker shutting down...');
  await worker.close();
  process.exit(0);
});
`);
}

logger.info('Workers configured');
