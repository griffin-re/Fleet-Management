const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { convoySchema } = require('../utils/validators');
const logger = require('../utils/logger');

// GET /api/convoys - Get all convoys
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM convoys ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching convoys', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/convoys/:id - Get convoy by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM convoys WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Convoy not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching convoy', { error: error.message, id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/convoys - Create new convoy
router.post('/', async (req, res) => {
  try {
    const { error, value } = convoySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, start_point_lat, start_point_lng, end_point_lat, end_point_lng, risk_level } = value;
    const result = await query(
      'INSERT INTO convoys (name, start_point_lat, start_point_lng, end_point_lat, end_point_lng, risk_level) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, start_point_lat, start_point_lng, end_point_lat, end_point_lng, risk_level || 'medium']
    );

    logger.info('Convoy created', { id: result.rows[0].id, name });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating convoy', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/convoys/:id - Update convoy
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_point_lat, start_point_lng, end_point_lat, end_point_lng, risk_level, status } = req.body;

    const result = await query(
      'UPDATE convoys SET name = $1, start_point_lat = $2, start_point_lng = $3, end_point_lat = $4, end_point_lng = $5, risk_level = $6, status = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [name, start_point_lat, start_point_lng, end_point_lat, end_point_lng, risk_level, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Convoy not found' });
    }

    logger.info('Convoy updated', { id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating convoy', { error: error.message, id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/convoys/:id - Delete convoy
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM convoys WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Convoy not found' });
    }

    logger.info('Convoy deleted', { id });
    res.json({ message: 'Convoy deleted successfully' });
  } catch (error) {
    logger.error('Error deleting convoy', { error: error.message, id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;