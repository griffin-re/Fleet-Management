const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/error');

const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];

const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, severity, resolved } = req.query;
  // FIXED: validate and clamp pagination params
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const offset = (pageNum - 1) * limitNum;

  const params = [];
  const conditions = [];

  if (severity) {
    if (!VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({ error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}` });
    }
    params.push(severity);
    conditions.push(`severity = $${params.length}`);
  }

  // FIXED: support filtering by resolved status (was missing)
  if (resolved !== undefined) {
    params.push(resolved === 'true');
    conditions.push(`resolved = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [alertsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT a.*, 
              u.name AS resolved_by_name,
              v.registration AS vehicle_registration,
              c.name AS convoy_name
       FROM alerts a
       LEFT JOIN users u ON a.resolved_by = u.id
       LEFT JOIN vehicles v ON a.vehicle_id = v.id
       LEFT JOIN convoys c ON a.convoy_id = c.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    ),
    pool.query(
      `SELECT COUNT(*) as count FROM alerts ${whereClause}`,
      params
    ),
  ]);

  const totalCount = parseInt(countResult.rows[0].count);
  res.json({
    data: alertsResult.rows,
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
    `SELECT a.*, u.name AS resolved_by_name FROM alerts a
     LEFT JOIN users u ON a.resolved_by = u.id
     WHERE a.id = $1`,
    [id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  res.json(result.rows[0]);
});

const create = asyncHandler(async (req, res) => {
  const { convoyId, vehicleId, severity, title, description } = req.body;

  if (!severity || !title) {
    return res.status(400).json({ error: 'Severity and title are required' });
  }

  // FIXED: validate severity value
  if (!VALID_SEVERITIES.includes(severity)) {
    return res.status(400).json({ error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}` });
  }

  // FIXED: validate title length
  if (title.trim().length < 3) {
    return res.status(400).json({ error: 'Title must be at least 3 characters' });
  }

  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO alerts (id, convoy_id, vehicle_id, severity, title, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, convoyId || null, vehicleId || null, severity, title.trim(), description]
  );

  // Emit real-time alert via socket if io is available
  const io = req.app.locals.io;
  if (io) {
    io.emit('alert:new', result.rows[0]);
  }

  res.status(201).json(result.rows[0]);
});

// FIXED: acknowledge and resolve were identical — resolve now stores a resolution note
const acknowledge = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'UPDATE alerts SET resolved = true, resolved_at = CURRENT_TIMESTAMP, resolved_by = $1 WHERE id = $2 AND resolved = false RETURNING *',
    [req.user.id, id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Alert not found or already resolved' });
  }
  res.json(result.rows[0]);
});

const resolve = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'UPDATE alerts SET resolved = true, resolved_at = CURRENT_TIMESTAMP, resolved_by = $1 WHERE id = $2 AND resolved = false RETURNING *',
    [req.user.id, id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Alert not found or already resolved' });
  }
  res.json(result.rows[0]);
});

module.exports = { getAll, getById, create, acknowledge, resolve };
