'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query("UPDATE books SET img = REPLACE(img, '&amp;', '&') WHERE img LIKE '%&amp;%';");
    await queryInterface.sequelize.query("UPDATE users SET img = REPLACE(img, '&amp;', '&') WHERE img LIKE '%&amp;%';");
  },

  async down() {
    // Irreversible data normalization: do not re-escape URLs on rollback.
  },
};
