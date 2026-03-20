import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class Comment extends Model<any, any> {
  public id!: number;
  public title!: string;
  public text!: string;
  public user_id!: number;
  public post_id!: number;
}

Comment.init(
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'comments',
  }
);
