'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('comments', 'parent_comment_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'comments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('comments', 'relevant_votes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('comments', 'less_relevant_votes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('comments', 'relevance_score', {
      type: Sequelize.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.createTable('comment_relevance_votes', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      comment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'comments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      value: {
        type: Sequelize.STRING(32),
        allowNull: false,
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

    await queryInterface.addIndex('comment_relevance_votes', ['comment_id', 'user_id'], {
      unique: true,
      name: 'comment_relevance_votes_comment_user_unique',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('comment_relevance_votes', 'comment_relevance_votes_comment_user_unique');
    await queryInterface.dropTable('comment_relevance_votes');

    await queryInterface.removeColumn('comments', 'relevance_score');
    await queryInterface.removeColumn('comments', 'less_relevant_votes');
    await queryInterface.removeColumn('comments', 'relevant_votes');
    await queryInterface.removeColumn('comments', 'parent_comment_id');
  },
};
