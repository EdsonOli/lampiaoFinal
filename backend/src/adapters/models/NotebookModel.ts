import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class Notebook extends Model<any, any> {
  public id!: number;
  public user_id!: number;
  public grade?: number;
  public status!: string;
  public favorite!: boolean;
  public book_id!: number;
}

Notebook.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    favorite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'notebooks',
  }
);
