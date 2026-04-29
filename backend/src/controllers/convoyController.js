const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/error');

const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM convoys WHERE deleted_at IS NULL';
  const params = [];

  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);

  const [convoysResult, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query('SELECT COUNT(*) as count FROM convoys WHERE deleted_at IS NULL' + (status ? ' AND status = $1' : ''), status ? [status] : []),
  ]);

  const totalCount = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    data: convoysResult.rows,
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
    'SELECT * FROM convoys WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Convoy not found' });
  }

  // Get assigned vehicles
  const vehiclesResult = await pool.query(
    'SELECT v.*, ca.role FROM vehicles v JOIN convoy_assignments ca ON v.id = ca.vehicle_id WHERE ca.convoy_id = $1',
    [id]
  );

  res.json({
    ...result.rows[0],
    assignedVehicles: vehiclesResult.rows,
  });
});

const create = asyncHandler(async (req, res) => {
  const { name, region, priority, description, departureTime } = req.body;

  if (!name || !region || !departureTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO convoys 
      (id, name, region, priority, description, departure_time, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [id, name, region, priority || 'medium', description, departureTime, 'planned', req.user.id]
  );

  res.status(201).json(result.rows[0]);
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, region, priority, description, departureTime } = req.body;

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
    [name, region, priority, description, departureTime, id]
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
    return res.status(400).json({ error: 'Status required' });
  }

  const result = await pool.query(
    'UPDATE convoys SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL RETURNING *',
    [status, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Convoy not found' });
  }

  res.json(result.rows[0]);
});

const assign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { vehicleId, driverId, escortId } = req.body;

  if (!vehicleId) {
    return res.status(400).json({ error: 'Vehicle ID required' });
  }

  const assignmentId = uuidv4();
  const result = await pool.query(
    `INSERT INTO convoy_assignments 
      (id, convoy_id, vehicle_id, driver_id, security_escort_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [assignmentId, id, vehicleId, driverId, escortId]
  );

  // Update vehicle assignment
  await pool.query(
    'UPDATE vehicles SET assigned_convoy_id = $1 WHERE id = $2',
    [id, vehicleId]
  );

  res.status(201).json(result.rows[0]);
});

const deleteConvoy = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    'UPDATE convoys SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Convoy not found' });
  }

  res.json({ message: 'Convoy deleted' });
});

const getEvents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // For now, return empty events
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
  assign,
  deleteConvoy,
  getEvents,
};
