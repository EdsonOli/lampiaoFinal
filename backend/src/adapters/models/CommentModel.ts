import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class Comment extends Model<any, any> {
  public id!: string;
  public title!: string;
  public text!: string;
  public user_id!: string;
  public post_id!: string;
}

Comment.init(
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
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'comments',
  }
);
