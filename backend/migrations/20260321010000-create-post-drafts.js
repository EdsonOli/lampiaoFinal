'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('post_drafts', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      book_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'books', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      device_id: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(160),
        allowNull: false,
        defaultValue: '',
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('post_drafts', ['user_id', 'book_id', 'device_id'], {
      unique: true,
      name: 'post_drafts_user_book_device_unique',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('post_drafts');
  },
};