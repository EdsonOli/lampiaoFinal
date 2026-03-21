import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class BookSeries extends Model<any, any> {
  public id!: string;
  public name!: string;
  public universeName?: string;
  public metadataSource?: string;
  public metadataConfidence!: 'low' | 'medium' | 'high';
  public createdAt?: Date;
  public updatedAt?: Date;
}

BookSeries.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    universeName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    metadataSource: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    metadataConfidence: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'low',
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'book_series',
    timestamps: true,
  }
);
