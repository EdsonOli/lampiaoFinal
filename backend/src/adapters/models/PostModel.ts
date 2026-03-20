import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class Post extends Model<any, any> {
  public id!: number;
  public title!: string;
  public text!: string;
  public is_it_public!: boolean;
  public user_id!: number;
  public book_id!: number;
}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_it_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'posts',
  }
);
