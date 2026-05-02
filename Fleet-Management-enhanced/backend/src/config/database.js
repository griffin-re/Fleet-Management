require('dotenv').config();
const { Pool } = require('pg');
const logger = { info: console.log, error: console.error, warn: console.warn };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

// Initialize database schema
const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'operator',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE deleted_at IS NULL;
    `);

    // Vehicles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(100) NOT NULL,
        registration VARCHAR(50) UNIQUE NOT NULL,
        region VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'idle',
        capacity INT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        last_ping TIMESTAMP,
        driver_id UUID REFERENCES users(id),
        assigned_convoy_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_vehicles_region ON vehicles(region) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_vehicles_convoy ON vehicles(assigned_convoy_id) WHERE deleted_at IS NULL;
    `);

    // Convoys table
    await client.query(`
      CREATE TABLE IF NOT EXISTS convoys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        region VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'planned',
        priority VARCHAR(50) NOT NULL DEFAULT 'medium',
        description TEXT,
        departure_time TIMESTAMP NOT NULL,
        arrival_time TIMESTAMP,
        estimated_arrival TIMESTAMP,
        route_origin VARCHAR(255),
        route_destination VARCHAR(255),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_convoys_status ON convoys(status) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_convoys_region ON convoys(region) WHERE deleted_at IS NULL;
    `);

    // Convoy assignments
    await client.query(`
      CREATE TABLE IF NOT EXISTS convoy_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        convoy_id UUID NOT NULL REFERENCES convoys(id),
        vehicle_id UUID NOT NULL REFERENCES vehicles(id),
        driver_id UUID REFERENCES users(id),
        security_escort_id UUID REFERENCES users(id),
        role VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(convoy_id, vehicle_id)
      );
    `);

    // Alerts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        convoy_id UUID REFERENCES convoys(id),
        vehicle_id UUID REFERENCES vehicles(id),
        severity VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        resolved_by UUID REFERENCES users(id)
      );
      CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity) WHERE resolved = FALSE;
      CREATE INDEX IF NOT EXISTS idx_alerts_convoy ON alerts(convoy_id) WHERE resolved = FALSE;
    `);

    // Incidents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        convoy_id UUID REFERENCES convoys(id),
        vehicle_id UUID REFERENCES vehicles(id),
        type VARCHAR(100) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'open',
        reported_by UUID REFERENCES users(id),
        description TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP,
        closed_by UUID REFERENCES users(id)
      );
      CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status) WHERE status != 'closed';
      CREATE INDEX IF NOT EXISTS idx_incidents_convoy ON incidents(convoy_id);
    `);

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id VARCHAR(100) NOT NULL,
        sender_id UUID NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id, created_at DESC);
    `);

    // Message channels
    await client.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Channel members
    await client.query(`
      CREATE TABLE IF NOT EXISTS channel_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id VARCHAR(100) NOT NULL REFERENCES channels(id),
        user_id UUID NOT NULL REFERENCES users(id),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(channel_id, user_id)
      );
    `);

    // Audit logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id UUID,
        before_state JSONB,
        after_state JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
    `);

    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  initializeDatabase,
};
