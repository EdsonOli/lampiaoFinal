import { GetPostDraft } from '../../core/usecases/GetPostDraft';
import { InMemoryPostDraftRepository } from '../fakes/InMemoryPostDraftRepository';

describe('GetPostDraft', () => {
  let postDraftRepository: InMemoryPostDraftRepository;
  let sut: GetPostDraft;

  beforeEach(() => {
    postDraftRepository = new InMemoryPostDraftRepository();
    sut = new GetPostDraft(postDraftRepository);
  });

  it('returns null when no draft exists', async () => {
    const result = await sut.execute({
      userId: 'user-1',
      bookId: 'book-1',
      deviceId: 'device-1',
    });

    expect(result).toBeNull();
  });

  it('returns draft when it exists for user/device/book', async () => {
    await postDraftRepository.save({
      userId: 'user-1',
      bookId: 'book-1',
      deviceId: 'device-1',
      title: 'Rascunho',
      text: 'Texto do rascunho',
      isItPublic: true,
    });

    const result = await sut.execute({
      userId: 'user-1',
      bookId: 'book-1',
      deviceId: 'device-1',
    });

    expect(result).not.toBeNull();
    expect(result?.title).toBe('Rascunho');
    expect(result?.text).toBe('Texto do rascunho');
  });
});