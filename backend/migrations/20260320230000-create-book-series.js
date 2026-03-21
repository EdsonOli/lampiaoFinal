'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('book_series', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      universeName: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      metadataSource: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Source of series data: google-books, open-library, manual, etc',
      },
      metadataConfidence: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        defaultValue: 'low',
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('book_series', ['name']);
    await queryInterface.addIndex('book_series', ['metadataSource']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('book_series');
  },
};
