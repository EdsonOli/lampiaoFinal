
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      'books',
      [
        {
          id: 1,
          name: 'O Cortiço',
          isbn: '9788572326979',
          publishing_company: 'Editora Martin Claret',
          writer: 'Aluisio Azevedo',
          genre: 'Romance',
          n_pages: 320,
          year_publication: 1890,
          img: null,
          synopsis: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Memorias Postumas de Bras Cubas',
          isbn: '9788535910665',
          publishing_company: 'Companhia das Letras',
          writer: 'Machado de Assis',
          genre: 'Romance',
          n_pages: 256,
          year_publication: 1881,
          img: null,
          synopsis: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          name: 'Dom Casmurro',
          isbn: '9788535902776',
          publishing_company: 'Companhia das Letras',
          writer: 'Machado de Assis',
          genre: 'Romance',
          n_pages: 288,
          year_publication: 1899,
          img: null,
          synopsis: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('books', null, {});
  },
};
