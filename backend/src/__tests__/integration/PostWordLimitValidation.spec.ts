import express from 'express';
import request from 'supertest';
import postRoutes from '../../adapters/routes/postRoutes';
import { errorHandler } from '../../adapters/middlewares/errorHandler';

jest.mock('../../adapters/container', () => ({
  Container: {
    useCases: {
      createPost: { execute: jest.fn() },
      deletePost: { execute: jest.fn() },
      getPostById: { execute: jest.fn() },
      listAllPosts: { execute: jest.fn() },
      listPostsByBook: { execute: jest.fn() },
      listPostsByUser: { execute: jest.fn() },
      updatePost: { execute: jest.fn() },
    },
  },
}));

jest.mock('../../adapters/middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.auth = {
      userId: 'reader-1',
      email: 'reader@lampiao.dev',
      role: 'user',
    };
    next();
  },
  optionalAuthenticate: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../adapters/services/AuditLogger', () => ({
  auditLog: jest.fn().mockResolvedValue(undefined),
}));

const {
  Container: {
    useCases: { createPost, updatePost },
  },
} = jest.requireMock('../../adapters/container') as {
  Container: {
    useCases: {
      createPost: { execute: jest.Mock };
      updatePost: { execute: jest.Mock };
    };
  };
};

const buildWords = (count: number): string => Array.from({ length: count }, () => 'luz').join(' ');

describe('Post word limit validation', () => {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/posts', postRoutes);
  app.use(errorHandler);

  const validBookId = '64f1bc40-1ce4-491a-b7d1-bf4d5dbd8df6';
  const validPostId = '1a64de8b-14f6-4c8f-b9d4-bceff9b0e873';

  const text40000Words = buildWords(40000);
  const text40001Words = `${text40000Words} extra`;

  beforeEach(() => {
    jest.clearAllMocks();
    createPost.execute.mockResolvedValue({
      id: validPostId,
      title: 'Capitulo de teste',
      text: text40000Words,
      userId: 'reader-1',
      bookId: validBookId,
      isItPublic: true,
    });

    updatePost.execute.mockResolvedValue({
      id: validPostId,
      title: 'Capitulo atualizado',
      text: text40000Words,
      userId: 'reader-1',
      bookId: validBookId,
      isItPublic: true,
    });
  });

  it('accepts create payload with exactly 40,000 words', async () => {
    const response = await request(app)
      .post('/posts')
      .send({
        title: 'Capitulo de teste',
        text: text40000Words,
        bookId: validBookId,
      });

    expect(response.status).toBe(201);
    expect(createPost.execute).toHaveBeenCalledTimes(1);
  });

  it('rejects create payload above 40,000 words', async () => {
    const response = await request(app)
      .post('/posts')
      .send({
        title: 'Capitulo longo demais',
        text: text40001Words,
        bookId: validBookId,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('40.000 palavras');
    expect(createPost.execute).not.toHaveBeenCalled();
  });

  it('accepts update payload with exactly 40,000 words', async () => {
    const response = await request(app)
      .put(`/posts/${validPostId}`)
      .send({
        text: text40000Words,
      });

    expect(response.status).toBe(200);
    expect(updatePost.execute).toHaveBeenCalledTimes(1);
  });

  it('rejects update payload above 40,000 words', async () => {
    const response = await request(app)
      .put(`/posts/${validPostId}`)
      .send({
        text: text40001Words,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('40.000 palavras');
    expect(updatePost.execute).not.toHaveBeenCalled();
  });

  it('rejects create payload with empty text after trim', async () => {
    const response = await request(app)
      .post('/posts')
      .send({
        title: 'Capitulo sem texto',
        text: '     ',
        bookId: validBookId,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Texto da publicacao nao pode ficar vazio');
    expect(createPost.execute).not.toHaveBeenCalled();
  });
});