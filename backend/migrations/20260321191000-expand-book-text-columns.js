'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('books', 'genre', {
      type: Sequelize.STRING(500),
      allowNull: false,
    });

    await queryInterface.changeColumn('books', 'img', {
      type: Sequelize.STRING(2048),
      allowNull: true,
    });

    await queryInterface.changeColumn('books', 'synopsis', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('books', 'genre', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.changeColumn('books', 'img', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.changeColumn('books', 'synopsis', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },
};
