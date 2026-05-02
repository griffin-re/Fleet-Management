const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/error');

// FIXED: removed unused uuidv4 import (auth doesn't create users here)

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // FIXED: basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email.toLowerCase().trim()]
  );

  if (result.rows.length === 0) {
    // FIXED: constant-time response to prevent user enumeration
    await bcryptjs.compare(password, '$2b$10$invalidhashpadding000000000000000000000000000');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = result.rows[0];

  // FIXED: check account status before comparing password
  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Account is not active. Contact your administrator.' });
  }

  const passwordValid = await bcryptjs.compare(password, user.password_hash);
  if (!passwordValid) {
    logger.warn(`Failed login attempt for email: ${email}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  logger.info(`User logged in: ${user.email}`);

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, email, name, role, status, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
    [req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(result.rows[0]);
});

const logout = asyncHandler(async (req, res) => {
  // JWT is stateless; token invalidation is handled on the client.
  // In production, add the token to a Redis blocklist here.
  logger.info(`User logged out: ${req.user?.email}`);
  res.json({ message: 'Logged out successfully' });
});

module.exports = { login, getCurrentUser, logout };
