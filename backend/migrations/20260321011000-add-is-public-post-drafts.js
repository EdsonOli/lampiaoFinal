'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('post_drafts', 'is_it_public', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('post_drafts', 'is_it_public');
  },
};
