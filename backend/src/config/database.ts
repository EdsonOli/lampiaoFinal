import 'dotenv/config';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME  || 'lampiao_api',
  process.env.DB_USER  || 'root',
  process.env.DB_PASS  || 'root',
  {
    host:    process.env.DB_HOST || '127.0.0.1',
    port:    Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

export default sequelize;
