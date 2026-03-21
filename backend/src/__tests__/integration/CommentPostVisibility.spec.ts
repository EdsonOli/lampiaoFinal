import express from 'express';
import request from 'supertest';
import commentRoutes from '../../adapters/routes/commentRoutes';
import { errorHandler } from '../../adapters/middlewares/errorHandler';

jest.mock('../../adapters/container', () => ({
  Container: {
    useCases: {
      createComment: { execute: jest.fn() },
      deleteComment: { execute: jest.fn() },
      getCommentById: { execute: jest.fn() },
      getPostById: { execute: jest.fn() },
      getCommentRelevanceVotesByUser: { execute: jest.fn() },
      listAllComments: { execute: jest.fn() },
      listCommentTreeByPost: { execute: jest.fn() },
      listCommentsByPost: { execute: jest.fn() },
      listCommentsByUser: { execute: jest.fn() },
      updateComment: { execute: jest.fn() },
      voteCommentRelevance: { execute: jest.fn() },
    },
  },
}));

jest.mock('../../adapters/middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.auth = {
      userId: req.headers['x-test-user-id'] || 'reader-1',
      email: 'reader@lampiao.dev',
      role: 'user',
    };
    next();
  },
  optionalAuthenticate: (req: any, _res: any, next: any) => {
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
}));

jest.mock('../../adapters/services/AuditLogger', () => ({
  auditLog: jest.fn().mockResolvedValue(undefined),
}));

const {
  Container: {
    useCases: { getPostById, listCommentTreeByPost, listCommentsByPost },
  },
} = jest.requireMock('../../adapters/container') as {
  Container: {
    useCases: {
      getPostById: { execute: jest.Mock };
      listCommentTreeByPost: { execute: jest.Mock };
      listCommentsByPost: { execute: jest.Mock };
    };
  };
};

describe('Comment post visibility routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/comments', commentRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
    listCommentsByPost.execute.mockResolvedValue([]);
    listCommentTreeByPost.execute.mockResolvedValue([]);
  });

  it('returns 404 for private post list when user is not owner', async () => {
    getPostById.execute.mockResolvedValue({
      id: 'post-private',
      title: 'Privado',
      text: 'Texto',
      isItPublic: false,
      userId: 'owner-1',
      bookId: 'book-1',
    });

    const response = await request(app)
      .get('/comments/post/post-private')
      .set('x-test-user-id', 'reader-1');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Post not found' });
    expect(listCommentsByPost.execute).not.toHaveBeenCalled();
  });

  it('returns 404 for private post tree when unauthenticated', async () => {
    getPostById.execute.mockResolvedValue({
      id: 'post-private',
      title: 'Privado',
      text: 'Texto',
      isItPublic: false,
      userId: 'owner-1',
      bookId: 'book-1',
    });

    const response = await request(app).get('/comments/post/post-private/tree');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Post not found' });
    expect(listCommentTreeByPost.execute).not.toHaveBeenCalled();
  });

  it('allows owner to access private post comments list and tree', async () => {
    getPostById.execute.mockResolvedValue({
      id: 'post-private',
      title: 'Privado',
      text: 'Texto',
      isItPublic: false,
      userId: 'owner-1',
      bookId: 'book-1',
    });

    const listResponse = await request(app)
      .get('/comments/post/post-private')
      .set('x-test-user-id', 'owner-1');

    const treeResponse = await request(app)
      .get('/comments/post/post-private/tree')
      .set('x-test-user-id', 'owner-1');

    expect(listResponse.status).toBe(200);
    expect(treeResponse.status).toBe(200);
    expect(listCommentsByPost.execute).toHaveBeenCalledWith('post-private');
    expect(listCommentTreeByPost.execute).toHaveBeenCalledWith('post-private');
  });
});
