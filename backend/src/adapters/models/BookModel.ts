
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class Book extends Model {
  public id!: string;
  public title!: string;
  public author!: string;
}

Book.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Books',
  }
);
