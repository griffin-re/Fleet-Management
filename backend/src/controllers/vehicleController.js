const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/error');

const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, region } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM vehicles WHERE deleted_at IS NULL';
  const params = [];

  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  if (region) {
    params.push(region);
    query += ` AND region = $${params.length}`;
  }

  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);

  const [vehiclesResult, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(
      'SELECT COUNT(*) as count FROM vehicles WHERE deleted_at IS NULL' +
      (status ? ' AND status = $1' : '') +
      (region ? (status ? ' AND region = $2' : ' AND region = $1') : ''),
      status && region ? [status, region] : status ? [status] : region ? [region] : []
    ),
  ]);

  const totalCount = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    data: vehiclesResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalCount,
      totalPages,
    },
  });
});

const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    'SELECT * FROM vehicles WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  res.json(result.rows[0]);
});

const create = asyncHandler(async (req, res) => {
  const { type, registration, region, capacity } = req.body;

  if (!type || !registration || !region) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = uuidv4();
  const result = await pool.query(
    'INSERT INTO vehicles (id, type, registration, region, capacity, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [id, type, registration, region, capacity, 'idle']
  );

  res.status(201).json(result.rows[0]);
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, registration, region, capacity } = req.body;

  const result = await pool.query(
    'UPDATE vehicles SET type = COALESCE($1, type), registration = COALESCE($2, registration), region = COALESCE($3, region), capacity = COALESCE($4, capacity), updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND deleted_at IS NULL RETURNING *',
    [type, registration, region, capacity, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  res.json(result.rows[0]);
});

const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status required' });
  }

  const result = await pool.query(
    'UPDATE vehicles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL RETURNING *',
    [status, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  res.json(result.rows[0]);
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    'UPDATE vehicles SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  res.json({ message: 'Vehicle deleted' });
});

const getHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  // For now, return empty history. In production, track all updates
  res.json({
    data: [],
    pagination: { page: parseInt(page), limit: parseInt(limit), totalCount: 0, totalPages: 0 },
  });
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  deleteVehicle,
  getHistory,
};
