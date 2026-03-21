import { VoteCommentRelevance } from '../../core/usecases/VoteCommentRelevance';
import { InMemoryCommentRepository } from '../fakes/InMemoryCommentRepository';

describe('VoteCommentRelevance', () => {
  let commentRepo: InMemoryCommentRepository;
  let sut: VoteCommentRelevance;

  beforeEach(() => {
    commentRepo = new InMemoryCommentRepository();
    sut = new VoteCommentRelevance(commentRepo);
  });

  it('should register a relevant vote and update score metrics', async () => {
    const comment = await commentRepo.create({
      title: 'Comentário útil',
      text: 'Texto',
      userId: 'author-1',
      postId: 'post-1',
    });

    const updated = await sut.execute({
      commentId: comment.id,
      userId: 'reader-1',
      value: 'relevant',
    });

    expect(updated.relevantVotes).toBe(1);
    expect(updated.lessRelevantVotes).toBe(0);
    expect(updated.relevanceScore).toBeGreaterThan(0);
  });

  it('should allow changing the vote while keeping one vote per user', async () => {
    const comment = await commentRepo.create({
      title: 'Comentário',
      text: 'Texto',
      userId: 'author-1',
      postId: 'post-1',
    });

    await sut.execute({
      commentId: comment.id,
      userId: 'reader-1',
      value: 'relevant',
    });

    const updated = await sut.execute({
      commentId: comment.id,
      userId: 'reader-1',
      value: 'less_relevant',
    });

    expect(updated.relevantVotes).toBe(0);
    expect(updated.lessRelevantVotes).toBe(1);
  });

  it('should reject self vote', async () => {
    const comment = await commentRepo.create({
      title: 'Comentário',
      text: 'Texto',
      userId: 'author-1',
      postId: 'post-1',
    });

    await expect(
      sut.execute({
        commentId: comment.id,
        userId: 'author-1',
        value: 'relevant',
      })
    ).rejects.toThrow('You cannot vote on your own comment');
  });
});
