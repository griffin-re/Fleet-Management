const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/error');

const VALID_STATUSES = ['idle', 'active', 'maintenance', 'deployed'];

const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, region } = req.query;
  // FIXED: validate and clamp pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const params = [];
  let where = 'WHERE v.deleted_at IS NULL';

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    params.push(status);
    where += ` AND v.status = $${params.length}`;
  }

  if (region) {
    params.push(region);
    where += ` AND v.region ILIKE $${params.length}`;
  }

  // FIXED: JOIN driver info for richer response
  const dataQuery = `
    SELECT v.*, u.name AS driver_name, u.email AS driver_email
    FROM vehicles v
    LEFT JOIN users u ON v.driver_id = u.id
    ${where}
    ORDER BY v.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const countQuery = `SELECT COUNT(*) as count FROM vehicles v ${where}`;

  const [vehiclesResult, countResult] = await Promise.all([
    pool.query(dataQuery, [...params, limitNum, offset]),
    pool.query(countQuery, params),
  ]);

  const totalCount = parseInt(countResult.rows[0].count);
  res.json({
    data: vehiclesResult.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
});

const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT v.*, u.name AS driver_name
     FROM vehicles v LEFT JOIN users u ON v.driver_id = u.id
     WHERE v.id = $1 AND v.deleted_at IS NULL`,
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
    return res.status(400).json({ error: 'type, registration, and region are required' });
  }

  // FIXED: validate capacity is a positive integer when provided
  if (capacity !== undefined && (isNaN(capacity) || parseInt(capacity) < 1)) {
    return res.status(400).json({ error: 'Capacity must be a positive integer' });
  }

  const id = uuidv4();
  const result = await pool.query(
    'INSERT INTO vehicles (id, type, registration, region, capacity, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [id, type.trim(), registration.trim().toUpperCase(), region.trim(), capacity ? parseInt(capacity) : null, 'idle']
  );

  logger.info(`Vehicle created: ${result.rows[0].id} by user ${req.user?.id}`);
  res.status(201).json(result.rows[0]);
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, registration, region, capacity } = req.body;

  if (capacity !== undefined && (isNaN(capacity) || parseInt(capacity) < 1)) {
    return res.status(400).json({ error: 'Capacity must be a positive integer' });
  }

  const result = await pool.query(
    `UPDATE vehicles 
     SET type = COALESCE($1, type),
         registration = COALESCE($2, registration),
         region = COALESCE($3, region),
         capacity = COALESCE($4, capacity),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5 AND deleted_at IS NULL
     RETURNING *`,
    [
      type?.trim() || null,
      registration?.trim().toUpperCase() || null,
      region?.trim() || null,
      capacity ? parseInt(capacity) : null,
      id,
    ]
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
    return res.status(400).json({ error: 'Status is required' });
  }

  // FIXED: validate status value
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const result = await pool.query(
    'UPDATE vehicles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL RETURNING *',
    [status, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  // Emit real-time update
  const io = req.app.locals.io;
  if (io) {
    io.emit('vehicle:update', result.rows[0]);
  }

  res.json(result.rows[0]);
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // FIXED: prevent deleting vehicles that are currently deployed/active in a convoy
  const vehicle = await pool.query(
    'SELECT status, assigned_convoy_id FROM vehicles WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );

  if (vehicle.rows.length === 0) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  if (vehicle.rows[0].assigned_convoy_id) {
    return res.status(409).json({ error: 'Cannot delete a vehicle currently assigned to a convoy' });
  }

  await pool.query(
    'UPDATE vehicles SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );

  logger.info(`Vehicle soft-deleted: ${id} by user ${req.user?.id}`);
  res.json({ message: 'Vehicle deleted successfully' });
});

const getHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  // FIXED: check vehicle exists first
  const vehicle = await pool.query(
    'SELECT id FROM vehicles WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  if (vehicle.rows.length === 0) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

  // Query audit log for this vehicle
  const result = await pool.query(
    `SELECT * FROM audit_logs WHERE resource_type = 'vehicle' AND resource_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [id, limitNum, (pageNum - 1) * limitNum]
  );

  res.json({
    data: result.rows,
    pagination: { page: pageNum, limit: limitNum, totalCount: result.rowCount, totalPages: Math.ceil(result.rowCount / limitNum) },
  });
});

module.exports = { getAll, getById, create, update, updateStatus, deleteVehicle, getHistory };
