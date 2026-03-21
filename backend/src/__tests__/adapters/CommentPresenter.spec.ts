import {
  toCommentListWithViewerVote,
  toCommentTreeWithViewerVote,
} from '../../adapters/presenters/CommentPresenter';
import { Comment } from '../../core/domain/Comment';

describe('CommentPresenter', () => {
  it('should enrich comment list with myVote', () => {
    const comments: Comment[] = [
      {
        id: 'c1',
        title: 'a',
        text: 'a',
        userId: 'u1',
        postId: 'p1',
        parentCommentId: null,
        relevantVotes: 0,
        lessRelevantVotes: 0,
        relevanceScore: 0,
      },
      {
        id: 'c2',
        title: 'b',
        text: 'b',
        userId: 'u2',
        postId: 'p1',
        parentCommentId: null,
        relevantVotes: 0,
        lessRelevantVotes: 0,
        relevanceScore: 0,
      },
    ];

    const result = toCommentListWithViewerVote(comments, { c1: 'relevant' });

    expect(result[0].myVote).toBe('relevant');
    expect(result[1].myVote).toBeUndefined();
  });

  it('should enrich comment tree with myVote recursively', () => {
    const tree = [
      {
        id: 'root',
        title: 'r',
        text: 'r',
        userId: 'u1',
        postId: 'p1',
        parentCommentId: null,
        relevantVotes: 0,
        lessRelevantVotes: 0,
        relevanceScore: 0,
        children: [
          {
            id: 'child',
            title: 'c',
            text: 'c',
            userId: 'u2',
            postId: 'p1',
            parentCommentId: 'root',
            relevantVotes: 0,
            lessRelevantVotes: 0,
            relevanceScore: 0,
            children: [],
          },
        ],
      },
    ];

    const result = toCommentTreeWithViewerVote(tree, { child: 'less_relevant' });

    expect(result[0].myVote).toBeUndefined();
    expect(result[0].children[0].myVote).toBe('less_relevant');
  });
});
