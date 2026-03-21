import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class CommentRelevanceVote extends Model<any, any> {
  public id!: string;
  public comment_id!: string;
  public user_id!: string;
  public value!: 'relevant' | 'less_relevant';
}

CommentRelevanceVote.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    comment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: {
        isIn: [['relevant', 'less_relevant']],
      },
    },
  },
  {
    sequelize,
    tableName: 'comment_relevance_votes',
    indexes: [
      {
        unique: true,
        fields: ['comment_id', 'user_id'],
      },
    ],
  }
);