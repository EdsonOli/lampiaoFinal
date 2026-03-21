import { GetCommentRelevanceVotesByUser } from '../../core/usecases/GetCommentRelevanceVotesByUser';
import { InMemoryCommentRepository } from '../fakes/InMemoryCommentRepository';

describe('GetCommentRelevanceVotesByUser', () => {
  let commentRepo: InMemoryCommentRepository;
  let sut: GetCommentRelevanceVotesByUser;

  beforeEach(() => {
    commentRepo = new InMemoryCommentRepository();
    sut = new GetCommentRelevanceVotesByUser(commentRepo);
  });

  it('should return only votes from the target user for target comments', async () => {
    const c1 = await commentRepo.create({ title: 'c1', text: 't', userId: 'a', postId: 'p' });
    const c2 = await commentRepo.create({ title: 'c2', text: 't', userId: 'a', postId: 'p' });

    await commentRepo.upsertRelevanceVote({ commentId: c1.id, userId: 'u-1', value: 'relevant' });
    await commentRepo.upsertRelevanceVote({ commentId: c2.id, userId: 'u-1', value: 'less_relevant' });
    await commentRepo.upsertRelevanceVote({ commentId: c1.id, userId: 'u-2', value: 'less_relevant' });

    const result = await sut.execute('u-1', [c1.id, c2.id]);

    expect(result).toEqual({
      [c1.id]: 'relevant',
      [c2.id]: 'less_relevant',
    });
  });
});
