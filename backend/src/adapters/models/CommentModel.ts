import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class Comment extends Model<any, any> {
  public id!: string;
  public title!: string;
  public text!: string;
  public user_id!: string;
  public post_id!: string;
  public parent_comment_id!: string | null;
  public relevant_votes!: number;
  public less_relevant_votes!: number;
  public relevance_score!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
    parent_comment_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    relevant_votes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    less_relevant_votes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    relevance_score: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'comments',
  }
);
