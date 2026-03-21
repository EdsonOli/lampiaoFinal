'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Defensive cleanup before unique constraint: keep latest notebook row per user/book pair.
    await queryInterface.sequelize.query(`
      DELETE FROM notebooks n
      USING notebooks d
      WHERE n.id < d.id
        AND n.user_id = d.user_id
        AND n.book_id = d.book_id;
    `);

    await queryInterface.addConstraint('notebooks', {
      fields: ['user_id', 'book_id'],
      type: 'unique',
      name: 'notebooks_user_book_unique',
    });

    await queryInterface.addIndex('posts', ['book_id', 'is_it_public', 'createdAt'], {
      name: 'posts_book_public_created_at_idx',
    });

    await queryInterface.addIndex('posts', ['user_id', 'createdAt'], {
      name: 'posts_user_created_at_idx',
    });

    await queryInterface.addIndex('comments', ['post_id', 'createdAt'], {
      name: 'comments_post_created_at_idx',
    });

    await queryInterface.addIndex('comments', ['post_id', 'parent_comment_id'], {
      name: 'comments_post_parent_idx',
    });

    await queryInterface.addIndex('comments', ['user_id', 'createdAt'], {
      name: 'comments_user_created_at_idx',
    });

    await queryInterface.addIndex('book_series_entries', ['seriesId', 'positionInSeries'], {
      name: 'book_series_entries_series_position_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('book_series_entries', 'book_series_entries_series_position_idx');

    await queryInterface.removeIndex('comments', 'comments_user_created_at_idx');
    await queryInterface.removeIndex('comments', 'comments_post_parent_idx');
    await queryInterface.removeIndex('comments', 'comments_post_created_at_idx');

    await queryInterface.removeIndex('posts', 'posts_user_created_at_idx');
    await queryInterface.removeIndex('posts', 'posts_book_public_created_at_idx');

    await queryInterface.removeConstraint('notebooks', 'notebooks_user_book_unique');
  },
};
