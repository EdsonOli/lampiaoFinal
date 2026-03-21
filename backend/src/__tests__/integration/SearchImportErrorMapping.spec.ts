import express from 'express';
import request from 'supertest';
import searchRoutes from '../../adapters/routes/searchRoutes';
import { errorHandler } from '../../adapters/middlewares/errorHandler';

jest.mock('../../adapters/container', () => ({
  Container: {
    useCases: {
      createBook: { execute: jest.fn() },
      searchExternalBooks: { execute: jest.fn() },
    },
  },
}));

jest.mock('../../adapters/middlewares/authenticate', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
}));

const {
  Container: {
    useCases: { createBook },
  },
} = jest.requireMock('../../adapters/container') as {
  Container: {
    useCases: {
      createBook: { execute: jest.Mock };
    };
  };
};

describe('Search import error mapping', () => {
  const app = express();
  app.use(express.json());
  app.use('/search-books', searchRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps SequelizeDatabaseError value too long to HTTP 400 with semantic code', async () => {
    createBook.execute.mockRejectedValueOnce({
      name: 'SequelizeDatabaseError',
      message: 'value too long for type character varying(255)',
    });

    const response = await request(app)
      .post('/search-books/import')
      .send({
        name: 'Livro teste',
        isbn: '9788535902774',
        publishingCompany: 'Editora Teste',
        writer: 'Autor Teste',
        genre: 'Fantasia',
        nPages: 400,
        yearPublication: 2020,
        img: 'https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('SEARCH_IMPORT_INVALID_DATA');
    expect(response.body.message).toContain('excedem o tamanho permitido');
  });
});
