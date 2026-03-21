import express from 'express';
import request from 'supertest';
import commentRoutes from '../../adapters/routes/commentRoutes';
import { errorHandler } from '../../adapters/middlewares/errorHandler';
import { ForbiddenError, NotFoundError } from '../../core/errors';

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
    useCases: { voteCommentRelevance },
  },
} = jest.requireMock('../../adapters/container') as {
  Container: {
    useCases: {
      voteCommentRelevance: {
        execute: jest.Mock;
      };
    };
  };
};

const mockVoteCommentRelevanceExecute = voteCommentRelevance.execute;

describe('Comment relevance vote error mapping', () => {
  const app = express();
  app.use(express.json());
  app.use('/comments', commentRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
    mockVoteCommentRelevanceExecute.mockResolvedValue({
      id: 'comment-1',
      title: 'Comentario',
      text: 'Texto',
      userId: 'author-1',
      postId: 'post-1',
      parentCommentId: null,
      relevantVotes: 2,
      lessRelevantVotes: 0,
      relevanceScore: 0.5,
    });
  });

  it('returns HTTP 401 when no authenticated user is present', async () => {
    const response = await request(app)
      .put('/comments/comment-1/relevance-vote')
      .send({ value: 'relevant' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    expect(mockVoteCommentRelevanceExecute).not.toHaveBeenCalled();
  });

  it('returns HTTP 400 for invalid vote payload', async () => {
    const response = await request(app)
      .put('/comments/comment-1/relevance-vote')
      .set('x-test-user-id', 'reader-1')
      .send({ value: 'invalid-vote' });

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(expect.any(String));
    expect(mockVoteCommentRelevanceExecute).not.toHaveBeenCalled();
  });

  it('maps ForbiddenError to HTTP 403', async () => {
    mockVoteCommentRelevanceExecute.mockRejectedValueOnce(
      new ForbiddenError('You cannot vote on your own comment')
    );

    const response = await request(app)
      .put('/comments/comment-1/relevance-vote')
      .set('x-test-user-id', 'reader-1')
      .send({ value: 'relevant' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'You cannot vote on your own comment' });
  });

  it('maps NotFoundError to HTTP 404', async () => {
    mockVoteCommentRelevanceExecute.mockRejectedValueOnce(new NotFoundError('Comment not found'));

    const response = await request(app)
      .put('/comments/comment-1/relevance-vote')
      .set('x-test-user-id', 'reader-1')
      .send({ value: 'relevant' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Comment not found' });
  });
});
