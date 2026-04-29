const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/error');

const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, severity } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM alerts';
  const params = [];

  if (severity) {
    params.push(severity);
    query += ` WHERE severity = $${params.length}`;
  }

  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);

  const [alertsResult, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query('SELECT COUNT(*) as count FROM alerts' + (severity ? ' WHERE severity = $1' : ''), severity ? [severity] : []),
  ]);

  const totalCount = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    data: alertsResult.rows,
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

  const result = await pool.query('SELECT * FROM alerts WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  res.json(result.rows[0]);
});

const create = asyncHandler(async (req, res) => {
  const { convoyId, vehicleId, severity, title, description } = req.body;

  if (!severity || !title) {
    return res.status(400).json({ error: 'Severity and title required' });
  }

  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO alerts (id, convoy_id, vehicle_id, severity, title, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, convoyId, vehicleId, severity, title, description]
  );

  res.status(201).json(result.rows[0]);
});

const acknowledge = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    'UPDATE alerts SET resolved = true, resolved_at = CURRENT_TIMESTAMP, resolved_by = $1 WHERE id = $2 RETURNING *',
    [req.user.id, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  res.json(result.rows[0]);
});

const resolve = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolution } = req.body;

  const result = await pool.query(
    'UPDATE alerts SET resolved = true, resolved_at = CURRENT_TIMESTAMP, resolved_by = $1 WHERE id = $2 RETURNING *',
    [req.user.id, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  res.json(result.rows[0]);
});

module.exports = {
  getAll,
  getById,
  create,
  acknowledge,
  resolve,
};
