const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let pool = null;

try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    pool.on('connect', () => {
      console.log('Database connected successfully');
    });
  } else {
    console.log('DATABASE_URL not set, database operations will be skipped');
  }
} catch (error) {
  console.error('Failed to initialize database pool:', error.message);
  console.log('Database operations will be skipped');
}

const query = async (text, params) => {
  if (!pool) {
    throw new Error('Database not available');
  }
  return pool.query(text, params);
};

const getClient = async () => {
  if (!pool) {
    throw new Error('Database not available');
  }
  return pool.connect();
};

module.exports = {
  query,
  getClient,
  pool,
};