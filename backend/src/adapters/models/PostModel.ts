import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class Post extends Model<any, any> {
  public id!: string;
  public title!: string;
  public text!: string;
  public is_it_public!: boolean;
  public user_id!: string;
  public book_id!: string;
}

Post.init(
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
    is_it_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    book_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'posts',
  }
);
