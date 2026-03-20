import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class Notebook extends Model<any, any> {
  public id!: string;
  public user_id!: string;
  public grade?: number;
  public status!: string;
  public favorite!: boolean;
  public book_id!: string;
}

Notebook.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
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
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'notebooks',
  }
);
