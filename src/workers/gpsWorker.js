const { Worker } = require('bullmq');
const { query } = require('../config/database');
const queue = require('../config/queue');
const { haversineDistance } = require('../utils/haversine');
const logger = require('../utils/logger');
const config = require('../config');

const createGpsWorker = (redisConnection) => {
  const gpsWorker = new Worker('gps', async (job) => {
    const { vehicle_id, lat, lng, speed, timestamp } = job.data;

    try {
    logger.info('Processing GPS data', { vehicle_id, lat, lng, speed });

    // Store raw GPS data
    await query(
      'INSERT INTO gps_logs (vehicle_id, lat, lng, speed, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [vehicle_id, lat, lng, speed, timestamp]
    );

    // Decision Logic: Check for alerts
    // 1. Speed alert
    if (speed > config.SPEED_ALERT_THRESHOLD) {
      await queue.alertQueue.add('create-alert', {
        vehicle_id,
        type: 'speeding',
        message: `Vehicle ${vehicle_id} exceeded speed limit: ${speed} km/h`,
        severity: 'high'
      });
    }

    // 2. Geofencing check
    try {
      // Get vehicle convoy
      const vehicleResult = await query('SELECT convoy_id FROM vehicles WHERE id = $1', [vehicle_id]);
      if (vehicleResult.rows.length > 0 && vehicleResult.rows[0].convoy_id) {
        const convoyId = vehicleResult.rows[0].convoy_id;
        const convoyResult = await query('SELECT * FROM convoys WHERE id = $1', [convoyId]);
        if (convoyResult.rows.length > 0) {
          const convoy = convoyResult.rows[0];
          // Check distance from convoy route (simplified: distance from start to end line)
          const distanceToRoute = calculateDistanceToRoute(lat, lng, convoy.start_point_lat, convoy.start_point_lng, convoy.end_point_lat, convoy.end_point_lng);
          if (distanceToRoute > config.GEOFENCE_RADIUS_KM) {
            await queue.alertQueue.add('create-alert', {
              vehicle_id,
              type: 'geofence',
              message: `Vehicle ${vehicle_id} deviated from convoy route by ${distanceToRoute.toFixed(2)} km`,
              severity: 'medium'
            });
          }
        }
      }
    } catch (geoError) {
      logger.warn('Geofencing check failed', { error: geoError.message, vehicle_id });
    }

    // Broadcast GPS update via WebSocket
    if (global.wsManager) {
      global.wsManager.broadcast({
        type: 'gps_update',
        vehicle_id,
        lat,
        lng,
        speed,
        timestamp
      });
    }

    logger.info('GPS data processed successfully', { vehicle_id });
  } catch (error) {
    logger.error('Error processing GPS data', { error: error.message, vehicle_id });
    throw error;
  }
}, {
  connection: redisConnection
});

gpsWorker.on('completed', (job) => {
  logger.info('GPS job completed', { jobId: job.id });
});

gpsWorker.on('failed', (job, err) => {
  logger.error('GPS job failed', { jobId: job.id, error: err.message });
});

  return gpsWorker;
};

// Simplified distance to route (distance to line segment)
function calculateDistanceToRoute(lat, lng, startLat, startLng, endLat, endLng) {
  // For simplicity, calculate distance to the midpoint of the route
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;
  return haversineDistance(lat, lng, midLat, midLng);
}

module.exports = createGpsWorker;