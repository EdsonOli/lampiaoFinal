import 'dotenv/config';
import { Sequelize } from 'sequelize';

const dialect = (process.env.DB_DIALECT || 'postgres') as 'postgres' | 'mysql';
const defaultPort = dialect === 'postgres' ? 5432 : 3306;

const sequelize = new Sequelize(
  process.env.DB_NAME || 'lampiao_db',
  process.env.DB_USER || 'lampiao',
  process.env.DB_PASSWORD || process.env.DB_PASS || 'lampiao_dev_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || defaultPort,
    dialect,
    logging: false,
  }
);

export default sequelize;
