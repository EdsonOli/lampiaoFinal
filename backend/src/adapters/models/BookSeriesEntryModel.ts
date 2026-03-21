import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class BookSeriesEntry extends Model<any, any> {
  public id!: string;
  public bookId!: string;
  public seriesId!: string;
  public positionInSeries?: number;
  public positionLabel?: string;
  public createdAt?: Date;
}

BookSeriesEntry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    seriesId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    positionInSeries: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    positionLabel: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'book_series_entries',
    timestamps: false,
  }
);
