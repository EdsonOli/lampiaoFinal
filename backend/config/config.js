require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'postgres';
const defaultPort = dialect === 'postgres' ? 5432 : 3306;

module.exports = {
  development: {
    username: process.env.DB_USER || 'lampiao',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'lampiao_dev_password',
    database: process.env.DB_NAME || 'lampiao_db',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || defaultPort,
    dialect,
  },
  test: {
    username: process.env.DB_USER || 'lampiao',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'lampiao_dev_password',
    database: process.env.DB_TEST_NAME || 'lampiao_test_db',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || defaultPort,
    dialect,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect,
  },
};