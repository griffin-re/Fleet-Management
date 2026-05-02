const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env');
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.warn(`⚠️ .env file not found at ${envPath}. Continuing with process environment variables.`);
}

require('./src/index.js');