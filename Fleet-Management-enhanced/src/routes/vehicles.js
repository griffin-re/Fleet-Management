const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { vehicleSchema } = require('../utils/validators');
const logger = require('../utils/logger');

// GET /api/vehicles - Get all vehicles
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM vehicles ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching vehicles', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/vehicles/:id - Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching vehicle', { error: error.message, id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/vehicles - Create new vehicle
router.post('/', async (req, res) => {
  try {
    const { error, value } = vehicleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { plate_number, make, model, year } = value;
    const result = await query(
      'INSERT INTO vehicles (plate_number, make, model, year) VALUES ($1, $2, $3, $4) RETURNING *',
      [plate_number, make, model, year]
    );

    logger.info('Vehicle created', { id: result.rows[0].id, plate_number });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Plate number already exists' });
    }
    logger.error('Error creating vehicle', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { plate_number, make, model, year, status, convoy_id } = req.body;

    const result = await query(
      'UPDATE vehicles SET plate_number = $1, make = $2, model = $3, year = $4, status = $5, convoy_id = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [plate_number, make, model, year, status, convoy_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    logger.info('Vehicle updated', { id });
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Plate number already exists' });
    }
    logger.error('Error updating vehicle', { error: error.message, id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    logger.info('Vehicle deleted', { id });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    logger.error('Error deleting vehicle', { error: error.message, id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;