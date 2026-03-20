'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop comments first (depends on posts)
    await queryInterface.dropTable('comments', { force: true });

    // Drop notebooks (depends on books and users)
    await queryInterface.dropTable('notebooks', { force: true });

    // Drop posts (depends on books and users)
    await queryInterface.dropTable('posts', { force: true });

    // Drop users (depended by posts, notebooks, comments)
    await queryInterface.dropTable('users', { force: true });

    // Drop books (depended by posts, notebooks)
    await queryInterface.dropTable('books', { force: true });

    // Recreate books with UUID
    await queryInterface.createTable('books', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isbn: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      publishing_company: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      writer: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      genre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      n_pages: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      year_publication: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      img: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      synopsis: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface) => {
    // In case we need to rollback, we'd need to recreate with INTEGER (not practical)
    // For this migration, we're committing to UUID conversion
    await queryInterface.dropTable('books', { force: true });
  },
};
