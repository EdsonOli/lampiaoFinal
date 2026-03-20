import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class User extends Model<any, any> {
  public id!: string;
  public name!: string;
  public email!: string;
  public nickname!: string;
  public password?: string;
  public img?: string;
  public authProvider!: 'local' | 'google';
  public providerId?: string;
  public emailVerified!: boolean;
  public role!: 'user' | 'admin';
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    img: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    authProvider: {
      type: DataTypes.ENUM('local', 'google'),
      allowNull: false,
      defaultValue: 'local',
      field: 'auth_provider',
    },
    providerId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'provider_id',
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'email_verified',
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
  },
  {
    sequelize,
    tableName: 'users',
  }
);
