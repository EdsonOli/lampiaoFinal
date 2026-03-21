import { ListCommentsByPost } from '../../core/usecases/ListCommentsByPost';
import { InMemoryCommentRepository } from '../fakes/InMemoryCommentRepository';

describe('ListCommentsByPost', () => {
  let commentRepo: InMemoryCommentRepository;
  let sut: ListCommentsByPost;

  beforeEach(() => {
    commentRepo = new InMemoryCommentRepository();
    sut = new ListCommentsByPost(commentRepo);
  });

  it('should sort roots and replies by relevance score', async () => {
    const lowRoot = await commentRepo.create({
      title: 'Raiz baixa',
      text: 'Texto',
      userId: 'u1',
      postId: 'post-1',
    });
    await commentRepo.updateRelevanceMetrics(
      lowRoot.id,
      { relevantVotes: 1, lessRelevantVotes: 4 },
      0.05
    );

    const highRoot = await commentRepo.create({
      title: 'Raiz alta',
      text: 'Texto',
      userId: 'u2',
      postId: 'post-1',
    });
    await commentRepo.updateRelevanceMetrics(
      highRoot.id,
      { relevantVotes: 8, lessRelevantVotes: 1 },
      0.55
    );

    const lowReply = await commentRepo.create({
      title: 'Resposta baixa',
      text: 'Texto',
      userId: 'u3',
      postId: 'post-1',
      parentCommentId: highRoot.id,
    });
    await commentRepo.updateRelevanceMetrics(
      lowReply.id,
      { relevantVotes: 1, lessRelevantVotes: 1 },
      0.12
    );

    const highReply = await commentRepo.create({
      title: 'Resposta alta',
      text: 'Texto',
      userId: 'u4',
      postId: 'post-1',
      parentCommentId: highRoot.id,
    });
    await commentRepo.updateRelevanceMetrics(
      highReply.id,
      { relevantVotes: 10, lessRelevantVotes: 2 },
      0.62
    );

    const result = await sut.execute('post-1');

    expect(result.map(c => c.id)).toEqual([
      highRoot.id,
      highReply.id,
      lowReply.id,
      lowRoot.id,
    ]);
  });
});
