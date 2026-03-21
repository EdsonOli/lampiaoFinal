import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../adapters/middlewares/errorHandler';

process.env.COMMENT_RELEVANCE_VOTE_MAX = '2';
process.env.COMMENT_RELEVANCE_VOTE_WINDOW_MS = '60000';

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
      userId: 'user-1',
      email: 'user-1@lampiao.dev',
      role: 'user',
    };
    next();
  },
  optionalAuthenticate: (req: any, _res: any, next: any) => {
    req.auth = undefined;
    next();
  },
}));

jest.mock('../../adapters/services/AuditLogger', () => ({
  auditLog: jest.fn().mockResolvedValue(undefined),
}));

const commentRoutes = require('../../adapters/routes/commentRoutes').default;

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

describe('Comment relevance vote route rate limit', () => {
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
      relevantVotes: 1,
      lessRelevantVotes: 0,
      relevanceScore: 0.42,
    });
  });

  it('returns HTTP 429 when vote limit is exceeded', async () => {
    await request(app)
      .put('/comments/comment-1/relevance-vote')
      .send({ value: 'relevant' })
      .expect(200);

    await request(app)
      .put('/comments/comment-1/relevance-vote')
      .send({ value: 'relevant' })
      .expect(200);

    const response = await request(app)
      .put('/comments/comment-1/relevance-vote')
      .send({ value: 'relevant' });

    expect(response.status).toBe(429);
    expect(response.body.message).toBe(
      'Voce excedeu o limite de votos de relevancia em comentarios. Aguarde um pouco antes de tentar novamente.'
    );
    expect(response.body.code).toBe('RATE_LIMIT_COMMENT_RELEVANCE_VOTE');
    expect(response.body.retryAfterSeconds).toEqual(expect.any(Number));
    expect(response.body.retryAfterSeconds).toBeGreaterThan(0);
  });
});
