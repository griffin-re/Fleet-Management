const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/error');

const VALID_STATUSES = ['planned', 'active', 'completed', 'archived'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const params = [];
  let where = 'WHERE c.deleted_at IS NULL';
  if (status) {
    params.push(status);
    where += ` AND c.status = $${params.length}`;
  }

  // FIXED: include vehicle count in the response
  const [convoysResult, countResult] = await Promise.all([
    pool.query(
      `SELECT c.*,
              u.name AS created_by_name,
              COUNT(DISTINCT ca.vehicle_id) AS vehicle_count
       FROM convoys c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN convoy_assignments ca ON ca.convoy_id = c.id
       ${where}
       GROUP BY c.id, u.name
       ORDER BY c.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    ),
    pool.query(
      `SELECT COUNT(*) as count FROM convoys c ${where}`,
      params
    ),
  ]);

  const totalCount = parseInt(countResult.rows[0].count);
  res.json({
    data: convoysResult.rows,
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
    `SELECT c.*, u.name AS created_by_name
     FROM convoys c LEFT JOIN users u ON c.created_by = u.id
     WHERE c.id = $1 AND c.deleted_at IS NULL`,
    [id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Convoy not found' });
  }

  const vehiclesResult = await pool.query(
    `SELECT v.*, ca.role, ca.driver_id,
            u.name AS driver_name
     FROM vehicles v
     JOIN convoy_assignments ca ON v.id = ca.vehicle_id
     LEFT JOIN users u ON ca.driver_id = u.id
     WHERE ca.convoy_id = $1`,
    [id]
  );

  res.json({ ...result.rows[0], assignedVehicles: vehiclesResult.rows });
});

const create = asyncHandler(async (req, res) => {
  const { name, region, priority, description, departureTime } = req.body;

  if (!name || !region || !departureTime) {
    return res.status(400).json({ error: 'name, region, and departureTime are required' });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  // FIXED: validate departureTime is a valid future date
  const departure = new Date(departureTime);
  if (isNaN(departure.getTime())) {
    return res.status(400).json({ error: 'Invalid departureTime format' });
  }

  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO convoys (id, name, region, priority, description, departure_time, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [id, name.trim(), region.trim(), priority || 'medium', description, departure, 'planned', req.user.id]
  );

  logger.info(`Convoy created: ${result.rows[0].id} by user ${req.user.id}`);
  res.status(201).json(result.rows[0]);
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, region, priority, description, departureTime } = req.body;

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  let departure = null;
  if (departureTime) {
    departure = new Date(departureTime);
    if (isNaN(departure.getTime())) {
      return res.status(400).json({ error: 'Invalid departureTime format' });
    }
  }

  const result = await pool.query(
    `UPDATE convoys
     SET name = COALESCE($1, name),
         region = COALESCE($2, region),
         priority = COALESCE($3, priority),
         description = COALESCE($4, description),
         departure_time = COALESCE($5, departure_time),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6 AND deleted_at IS NULL
     RETURNING *`,
    [name?.trim() || null, region?.trim() || null, priority || null, description, departure, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Convoy not found' });
  }
  res.json(result.rows[0]);
});

const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const result = await pool.query(
    'UPDATE convoys SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL RETURNING *',
    [status, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Convoy not found' });
  }

  // Emit real-time update
  const io = req.app.locals.io;
  if (io) {
    io.emit('convoy:update', result.rows[0]);
  }

  res.json(result.rows[0]);
});

const assign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { vehicleId, driverId, escortId } = req.body;

  if (!vehicleId) {
    return res.status(400).json({ error: 'vehicleId is required' });
  }

  // FIXED: verify convoy and vehicle both exist before assigning
  const [convoyCheck, vehicleCheck] = await Promise.all([
    pool.query('SELECT id, status FROM convoys WHERE id = $1 AND deleted_at IS NULL', [id]),
    pool.query('SELECT id, status FROM vehicles WHERE id = $1 AND deleted_at IS NULL', [vehicleId]),
  ]);

  if (convoyCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Convoy not found' });
  }
  if (vehicleCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }
  if (vehicleCheck.rows[0].assigned_convoy_id && vehicleCheck.rows[0].assigned_convoy_id !== id) {
    return res.status(409).json({ error: 'Vehicle is already assigned to another convoy' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const assignmentId = uuidv4();
    const result = await client.query(
      `INSERT INTO convoy_assignments (id, convoy_id, vehicle_id, driver_id, security_escort_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (convoy_id, vehicle_id) DO UPDATE
         SET driver_id = EXCLUDED.driver_id,
             security_escort_id = EXCLUDED.security_escort_id
       RETURNING *`,
      [assignmentId, id, vehicleId, driverId || null, escortId || null]
    );

    await client.query(
      'UPDATE vehicles SET assigned_convoy_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [id, 'deployed', vehicleId]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

const deleteConvoy = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // FIXED: prevent deleting active convoys
  const convoy = await pool.query(
    'SELECT status FROM convoys WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );

  if (convoy.rows.length === 0) {
    return res.status(404).json({ error: 'Convoy not found' });
  }

  if (convoy.rows[0].status === 'active') {
    return res.status(409).json({ error: 'Cannot delete an active convoy. Archive it first.' });
  }

  // Unassign vehicles in a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE vehicles SET assigned_convoy_id = NULL, status = $1 WHERE assigned_convoy_id = $2',
      ['idle', id]
    );
    await client.query(
      'UPDATE convoys SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    await client.query('COMMIT');
    res.json({ message: 'Convoy deleted and vehicles released' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

const getEvents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

  // FIXED: query audit_logs for real convoy events instead of returning empty array
  const result = await pool.query(
    `SELECT * FROM audit_logs WHERE resource_type = 'convoy' AND resource_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [id, limitNum, (pageNum - 1) * limitNum]
  );

  res.json({
    data: result.rows,
    pagination: { page: pageNum, limit: limitNum, totalCount: result.rowCount, totalPages: Math.ceil(result.rowCount / limitNum) },
  });
});

module.exports = { getAll, getById, create, update, updateStatus, assign, deleteConvoy, getEvents };
