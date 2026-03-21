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
      userId: req.headers['x-test-user-id'] || 'user-auth',
      email: 'user@lampiao.dev',
      role: 'user',
    };
    next();
  },
  optionalAuthenticate: (req: any, _res: any, next: any) => {
    const userId = req.headers['x-test-user-id'];
    if (typeof userId === 'string' && userId.length > 0) {
      req.auth = {
        userId,
        email: 'user@lampiao.dev',
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
    useCases: {
      getPostById,
      getCommentRelevanceVotesByUser,
      listCommentTreeByPost,
      listCommentsByPost,
    },
  },
} = jest.requireMock('../../adapters/container') as {
  Container: {
    useCases: {
      getPostById: { execute: jest.Mock };
      getCommentRelevanceVotesByUser: { execute: jest.Mock };
      listCommentTreeByPost: { execute: jest.Mock };
      listCommentsByPost: { execute: jest.Mock };
    };
  };
};

describe('Comment viewer vote projection', () => {
  const app = express();
  app.use(express.json());
  app.use('/comments', commentRoutes);
  app.use(errorHandler);

  const commentA = {
    id: 'c-a',
    title: 'A',
    text: 'A',
    userId: 'author-a',
    postId: 'post-1',
    parentCommentId: null,
    relevantVotes: 3,
    lessRelevantVotes: 0,
    relevanceScore: 0.4,
  };

  const commentB = {
    id: 'c-b',
    title: 'B',
    text: 'B',
    userId: 'author-b',
    postId: 'post-1',
    parentCommentId: null,
    relevantVotes: 1,
    lessRelevantVotes: 0,
    relevanceScore: 0.2,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    getPostById.execute.mockResolvedValue({
      id: 'post-1',
      title: 'Post',
      text: 'Text',
      isItPublic: true,
      userId: 'author-post',
      bookId: 'book-1',
    });

    listCommentsByPost.execute.mockResolvedValue([commentA, commentB]);
    listCommentTreeByPost.execute.mockResolvedValue([
      {
        ...commentA,
        children: [{ ...commentB, parentCommentId: 'c-a', children: [] }],
      },
    ]);

    getCommentRelevanceVotesByUser.execute.mockResolvedValue({
      'c-a': 'relevant',
      'c-b': 'less_relevant',
    });
  });

  it('returns myVote on list endpoint when authenticated', async () => {
    const response = await request(app)
      .get('/comments/post/post-1')
      .set('x-test-user-id', 'reader-1');

    expect(response.status).toBe(200);
    expect(getCommentRelevanceVotesByUser.execute).toHaveBeenCalledWith('reader-1', ['c-a', 'c-b']);
    expect(response.body[0].myVote).toBe('relevant');
    expect(response.body[1].myVote).toBe('less_relevant');
  });

  it('does not project myVote on list endpoint when unauthenticated', async () => {
    const response = await request(app).get('/comments/post/post-1');

    expect(response.status).toBe(200);
    expect(getCommentRelevanceVotesByUser.execute).not.toHaveBeenCalled();
    expect(response.body[0].myVote).toBeUndefined();
  });

  it('returns myVote on tree endpoint when authenticated', async () => {
    const response = await request(app)
      .get('/comments/post/post-1/tree')
      .set('x-test-user-id', 'reader-1');

    expect(response.status).toBe(200);
    expect(getCommentRelevanceVotesByUser.execute).toHaveBeenCalledWith('reader-1', ['c-a', 'c-b']);
    expect(response.body[0].myVote).toBe('relevant');
    expect(response.body[0].children[0].myVote).toBe('less_relevant');
  });
});
