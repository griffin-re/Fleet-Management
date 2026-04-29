require('dotenv').config();
const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/database');
const logger = require('../src/utils/logger');

const seedDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create demo users
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash('password123', salt);

    const adminId = uuidv4();
    const dispatcherId = uuidv4();
    const operatorId = uuidv4();

    await client.query(
      `INSERT INTO users (id, email, name, password_hash, role, status)
       VALUES ($1, 'admin@convoy.local', 'Admin User', $2, 'admin', 'active'),
              ($3, 'dispatcher@convoy.local', 'Dispatcher', $2, 'dispatcher', 'active'),
              ($4, 'operator@convoy.local', 'Field Operator', $2, 'operator', 'active')
       ON CONFLICT DO NOTHING`,
      [adminId, passwordHash, dispatcherId, operatorId]
    );

    logger.info('Users seeded');

    // Create demo vehicles
    const regions = ['Kenya', 'DRC', 'Tanzania', 'Mali'];
    const types = ['Truck', 'SUV', 'Van', 'Bus'];

    for (let i = 0; i < 15; i++) {
      const vehicleId = uuidv4();
      const type = types[i % types.length];
      const region = regions[i % regions.length];

      await client.query(
        `INSERT INTO vehicles (id, type, registration, region, capacity, status, driver_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [
          vehicleId,
          type,
          `REG-${String(i + 1).padStart(4, '0')}`,
          region,
          Math.floor(Math.random() * 1000) + 500,
          ['active', 'idle', 'maintenance'][i % 3],
          operatorId,
        ]
      );
    }

    logger.info('Vehicles seeded');

    // Create demo convoys
    for (let i = 0; i < 5; i++) {
      const convoyId = uuidv4();
      const region = regions[i % regions.length];

      await client.query(
        `INSERT INTO convoys 
         (id, name, region, priority, departure_time, status, created_by, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [
          convoyId,
          `Mission ${String(i + 1).padStart(2, '0')}`,
          region,
          ['low', 'medium', 'high', 'critical'][i % 4],
          new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
          ['planned', 'active', 'completed'][i % 3],
          adminId,
          `Security convoy for ${region} region`,
        ]
      );
    }

    logger.info('Convoys seeded');

    // Create demo alerts
    for (let i = 0; i < 3; i++) {
      const alertId = uuidv4();

      await client.query(
        `INSERT INTO alerts (id, severity, title, description, resolved)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [
          alertId,
          ['low', 'medium', 'high', 'critical'][i % 4],
          `Alert ${String(i + 1).padStart(2, '0')}`,
          'Sample alert message',
          false,
        ]
      );
    }

    logger.info('Alerts seeded');

    await client.query('COMMIT');
    logger.info('Database seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Seed error:', error);
    throw error;
  } finally {
    client.release();
  }
};

seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Seed failed:', error);
    process.exit(1);
  });
