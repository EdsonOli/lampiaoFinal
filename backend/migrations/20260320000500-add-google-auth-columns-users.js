'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'auth_provider', {
      type: Sequelize.ENUM('local', 'google'),
      allowNull: false,
      defaultValue: 'local',
    });

    await queryInterface.addColumn('users', 'provider_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('users', 'email_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.removeColumn('users', 'email_verified');
    await queryInterface.removeColumn('users', 'provider_id');
    await queryInterface.removeColumn('users', 'auth_provider');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_users_auth_provider;');
  },
};
