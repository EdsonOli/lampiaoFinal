import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export class PostDraft extends Model<any, any> {
  public id!: string;
  public user_id!: string;
  public book_id!: string;
  public device_id!: string;
  public title!: string;
  public text!: string;
  public is_it_public!: boolean;
}

PostDraft.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    book_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    device_id: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false,
      defaultValue: '',
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    is_it_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'post_drafts',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'book_id', 'device_id'],
        name: 'post_drafts_user_book_device_unique',
      },
    ],
  }
);