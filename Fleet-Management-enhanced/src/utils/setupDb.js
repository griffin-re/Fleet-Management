const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const logger = require('../utils/logger');

async function createTables() {
  if (!process.env.DATABASE_URL) {
    logger.info('DATABASE_URL not configured; skipping database setup');
    return;
  }

  try {
    // Test database connection first
    await query('SELECT 1');

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create vehicles table
    await query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        plate_number VARCHAR(20) UNIQUE NOT NULL,
        make VARCHAR(50),
        model VARCHAR(50),
        year INTEGER,
        status VARCHAR(20) DEFAULT 'active',
        convoy_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create convoys table
    await query(`
      CREATE TABLE IF NOT EXISTS convoys (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        start_point_lat DECIMAL(10, 8),
        start_point_lng DECIMAL(11, 8),
        end_point_lat DECIMAL(10, 8),
        end_point_lng DECIMAL(11, 8),
        risk_level VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'planned',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create gps_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS gps_logs (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        speed DECIMAL(5, 2) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create alerts table
    await query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        severity VARCHAR(20) DEFAULT 'medium',
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_gps_logs_vehicle_timestamp ON gps_logs(vehicle_id, timestamp);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_created ON alerts(vehicle_id, created_at);`);

    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Database setup failed', { error: error.message, stack: error.stack });
    // Always continue - Railway will provide services later
    logger.warn('Continuing without database setup - services may not be ready yet');
  }
}

async function ensureDefaultUser(email, password) {
  if (!process.env.DATABASE_URL) {
    logger.info('DATABASE_URL not configured; skipping default user seed');
    return;
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      logger.info('Default user already exists', { email });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
      [email, hashedPassword]
    );

    logger.info('Default user seeded', { email, id: result.rows[0].id });
  } catch (error) {
    logger.error('Default user seed failed', { error: error.message, email });
  }
}

module.exports = { createTables, ensureDefaultUser };