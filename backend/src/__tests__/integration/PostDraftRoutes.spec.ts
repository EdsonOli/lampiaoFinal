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
      savePostDraft: { execute: jest.fn() },
      getPostDraft: { execute: jest.fn() },
      deletePostDraft: { execute: jest.fn() },
    },
  },
}));

jest.mock('../../adapters/middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    const userId = req.headers['x-test-user-id'];
    if (typeof userId === 'string' && userId.length > 0) {
      req.auth = {
        userId,
        email: 'reader@lampiao.dev',
        role: 'user',
      };
    }
    next();
  },
  optionalAuthenticate: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../adapters/services/AuditLogger', () => ({
  auditLog: jest.fn().mockResolvedValue(undefined),
}));

const {
  Container: {
    useCases: { savePostDraft, getPostDraft, deletePostDraft },
  },
} = jest.requireMock('../../adapters/container') as {
  Container: {
    useCases: {
      savePostDraft: { execute: jest.Mock };
      getPostDraft: { execute: jest.Mock };
      deletePostDraft: { execute: jest.Mock };
    };
  };
};

describe('Post draft routes', () => {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/posts', postRoutes);
  app.use(errorHandler);

  const bookId = '64f1bc40-1ce4-491a-b7d1-bf4d5dbd8df6';

  beforeEach(() => {
    jest.clearAllMocks();
    savePostDraft.execute.mockResolvedValue({
      id: 'draft-1',
      userId: 'reader-1',
      bookId,
      deviceId: 'web-chrome-1',
      title: 'Rascunho',
      text: 'Texto inicial',
      isItPublic: true,
    });
    getPostDraft.execute.mockResolvedValue(null);
  });

  it('returns 401 when saving draft without auth', async () => {
    const response = await request(app)
      .put(`/posts/drafts/${bookId}`)
      .send({
        deviceId: 'web-chrome-1',
        text: 'Texto',
      });

    expect(response.status).toBe(401);
    expect(savePostDraft.execute).not.toHaveBeenCalled();
  });

  it('saves draft for authenticated user and device', async () => {
    const response = await request(app)
      .put(`/posts/drafts/${bookId}`)
      .set('x-test-user-id', 'reader-1')
      .send({
        deviceId: 'web-chrome-1',
        title: 'Rascunho',
        text: 'Texto inicial',
        isItPublic: false,
      });

    expect(response.status).toBe(200);
    expect(savePostDraft.execute).toHaveBeenCalledWith({
      userId: 'reader-1',
      bookId,
      deviceId: 'web-chrome-1',
      title: 'Rascunho',
      text: 'Texto inicial',
      isItPublic: false,
    });
  });

  it('returns 400 when title and text are both omitted', async () => {
    const response = await request(app)
      .put(`/posts/drafts/${bookId}`)
      .set('x-test-user-id', 'reader-1')
      .send({
        deviceId: 'web-chrome-1',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Informe titulo, texto ou visibilidade para salvar o rascunho');
    expect(savePostDraft.execute).not.toHaveBeenCalled();
  });

  it('returns draft for authenticated user/device/book', async () => {
    getPostDraft.execute.mockResolvedValueOnce({
      id: 'draft-1',
      userId: 'reader-1',
      bookId,
      deviceId: 'web-chrome-1',
      title: 'Rascunho',
      text: 'Texto inicial',
      isItPublic: true,
    });

    const response = await request(app)
      .get(`/posts/drafts/${bookId}`)
      .set('x-test-user-id', 'reader-1')
      .query({ deviceId: 'web-chrome-1' });

    expect(response.status).toBe(200);
    expect(response.body.draft).toEqual({
      id: 'draft-1',
      userId: 'reader-1',
      bookId,
      deviceId: 'web-chrome-1',
      title: 'Rascunho',
      text: 'Texto inicial',
      isItPublic: true,
    });
    expect(getPostDraft.execute).toHaveBeenCalledWith({
      userId: 'reader-1',
      bookId,
      deviceId: 'web-chrome-1',
    });
  });

  it('deletes draft for authenticated user and device', async () => {
    const response = await request(app)
      .delete(`/posts/drafts/${bookId}`)
      .set('x-test-user-id', 'reader-1')
      .query({ deviceId: 'web-chrome-1' });

    expect(response.status).toBe(204);
    expect(deletePostDraft.execute).toHaveBeenCalledWith({
      userId: 'reader-1',
      bookId,
      deviceId: 'web-chrome-1',
    });
  });
});