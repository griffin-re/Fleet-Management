const express = require('express');
const router = express.Router();
const queue = require('../config/queue');
const { gpsDataSchema } = require('../utils/validators');
const logger = require('../utils/logger');

// POST /api/gps
router.post('/', async (req, res) => {
  try {
    // Validate input
    const { error, value } = gpsDataSchema.validate(req.body);
    if (error) {
      logger.warn('GPS data validation failed', { error: error.details[0].message, body: req.body });
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!queue.gpsQueue) {
      logger.error('GPS Queue not initialized');
      return res.status(503).json({ error: 'GPS service not available' });
    }

    const { vehicle_id, lat, lng, speed, timestamp } = value;

    // Add job to queue
    await queue.gpsQueue.add('process-gps', {
      vehicle_id,
      lat,
      lng,
      speed,
      timestamp: timestamp || new Date().toISOString()
    });

    logger.info('GPS data queued', { vehicle_id, lat, lng, speed });
    res.status(202).json({ message: 'GPS data queued for processing' });
  } catch (error) {
    logger.error('Error queuing GPS data', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;