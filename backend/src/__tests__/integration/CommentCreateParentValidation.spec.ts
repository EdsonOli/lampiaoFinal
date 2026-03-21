import express from 'express';
import request from 'supertest';
import commentRoutes from '../../adapters/routes/commentRoutes';
import { errorHandler } from '../../adapters/middlewares/errorHandler';
import { NotFoundError } from '../../core/errors';

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
    useCases: { createComment },
  },
} = jest.requireMock('../../adapters/container') as {
  Container: {
    useCases: {
      createComment: {
        execute: jest.Mock;
      };
    };
  };
};

const mockCreateCommentExecute = createComment.execute;

describe('Comment create parent validation', () => {
  const app = express();
  app.use(express.json());
  app.use('/comments', commentRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateCommentExecute.mockResolvedValue({
      id: 'comment-1',
      title: 'Resposta',
      text: 'Texto',
      userId: 'reader-1',
      postId: 'post-1',
      parentCommentId: '4b4e1aa0-b4c2-4eec-9a8d-3b22767e47df',
      relevantVotes: 0,
      lessRelevantVotes: 0,
      relevanceScore: 0,
    });
  });

  it('returns HTTP 400 when parentCommentId is not a valid UUID', async () => {
    const response = await request(app)
      .post('/comments')
      .send({
        title: 'Resposta',
        text: 'Texto',
        postId: '64f1bc40-1ce4-491a-b7d1-bf4d5dbd8df6',
        parentCommentId: 'invalid-parent-id',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(expect.any(String));
    expect(mockCreateCommentExecute).not.toHaveBeenCalled();
  });

  it('maps parent comment not found to HTTP 404', async () => {
    mockCreateCommentExecute.mockRejectedValueOnce(new NotFoundError('Parent comment not found'));

    const response = await request(app)
      .post('/comments')
      .send({
        title: 'Resposta',
        text: 'Texto',
        postId: '64f1bc40-1ce4-491a-b7d1-bf4d5dbd8df6',
        parentCommentId: '4b4e1aa0-b4c2-4eec-9a8d-3b22767e47df',
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Parent comment not found' });
  });
});
