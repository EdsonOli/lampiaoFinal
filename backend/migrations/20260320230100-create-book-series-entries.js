'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('book_series_entries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      bookId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'books',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      seriesId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'book_series',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      positionInSeries: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Order of book in the series (1-based)',
      },
      positionLabel: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Human-readable position label: "Book 1", "Volume 2", etc',
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Ensure one-to-many relationship: book can belong to multiple series, but only once per series
    await queryInterface.addConstraint('book_series_entries', {
      fields: ['bookId', 'seriesId'],
      type: 'unique',
      name: 'unique_book_series_entry',
    });

    await queryInterface.addIndex('book_series_entries', ['seriesId']);
    await queryInterface.addIndex('book_series_entries', ['bookId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('book_series_entries');
  },
};
