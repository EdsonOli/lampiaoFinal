import { ListCommentTreeByPost } from '../../core/usecases/ListCommentTreeByPost';
import { InMemoryCommentRepository } from '../fakes/InMemoryCommentRepository';

describe('ListCommentTreeByPost', () => {
  let commentRepo: InMemoryCommentRepository;
  let sut: ListCommentTreeByPost;

  beforeEach(() => {
    commentRepo = new InMemoryCommentRepository();
    sut = new ListCommentTreeByPost(commentRepo);
  });

  it('should return sorted roots and children as tree', async () => {
    const rootLow = await commentRepo.create({
      title: 'Root low',
      text: 'Texto',
      userId: 'u1',
      postId: 'post-1',
    });
    await commentRepo.updateRelevanceMetrics(
      rootLow.id,
      { relevantVotes: 1, lessRelevantVotes: 2 },
      0.09
    );

    const rootHigh = await commentRepo.create({
      title: 'Root high',
      text: 'Texto',
      userId: 'u2',
      postId: 'post-1',
    });
    await commentRepo.updateRelevanceMetrics(
      rootHigh.id,
      { relevantVotes: 7, lessRelevantVotes: 1 },
      0.52
    );

    const childLow = await commentRepo.create({
      title: 'Child low',
      text: 'Texto',
      userId: 'u3',
      postId: 'post-1',
      parentCommentId: rootHigh.id,
    });
    await commentRepo.updateRelevanceMetrics(
      childLow.id,
      { relevantVotes: 1, lessRelevantVotes: 1 },
      0.15
    );

    const childHigh = await commentRepo.create({
      title: 'Child high',
      text: 'Texto',
      userId: 'u4',
      postId: 'post-1',
      parentCommentId: rootHigh.id,
    });
    await commentRepo.updateRelevanceMetrics(
      childHigh.id,
      { relevantVotes: 8, lessRelevantVotes: 0 },
      0.66
    );

    const tree = await sut.execute('post-1');

    expect(tree).toHaveLength(2);
    expect(tree[0].id).toBe(rootHigh.id);
    expect(tree[1].id).toBe(rootLow.id);

    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].id).toBe(childHigh.id);
    expect(tree[0].children[1].id).toBe(childLow.id);
  });
});
