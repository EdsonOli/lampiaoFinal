
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class Book extends Model<any, any> {
  public id!: number;
  public name!: string;
  public isbn!: string;
  public publishing_company!: string;
  public writer!: string;
  public genre!: string;
  public n_pages!: number;
  public year_publication!: number;
  public img?: string;
  public synopsis?: string;
}

Book.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isbn: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    publishing_company: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    writer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    genre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    n_pages: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    year_publication: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    img: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    synopsis: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'books',
  }
);
