require('dotenv').config();
const logger = require('../src/utils/logger');
const { initializeDatabase } = require('../src/config/database');

const startMigration = async () => {
  try {
    logger.info('Starting database initialization...');
    await initializeDatabase();
    logger.info('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

startMigration();
