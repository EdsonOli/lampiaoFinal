import { InMemoryBookRepository } from '../../adapters/repositories/InMemoryBookRepository';
import { SavePostDraft } from '../../core/usecases/SavePostDraft';
import { InMemoryPostDraftRepository } from '../fakes/InMemoryPostDraftRepository';

describe('SavePostDraft', () => {
  const BOOK_ID_1 = '550e8400-e29b-41d4-a716-446655440000';
  let bookRepository: InMemoryBookRepository;
  let postDraftRepository: InMemoryPostDraftRepository;
  let sut: SavePostDraft;

  beforeEach(() => {
    bookRepository = new InMemoryBookRepository();
    postDraftRepository = new InMemoryPostDraftRepository();
    sut = new SavePostDraft(postDraftRepository, bookRepository);
  });

  it('creates a new draft for user/device/book', async () => {
    const draft = await sut.execute({
      userId: 'user-1',
      deviceId: 'web-chrome-1',
      bookId: BOOK_ID_1,
      title: 'Capitulo 1',
      text: 'Era uma noite de reuniao na biblioteca.',
      isItPublic: false,
    });

    expect(draft.id).toEqual(expect.any(String));
    expect(draft.userId).toBe('user-1');
    expect(draft.deviceId).toBe('web-chrome-1');
    expect(draft.bookId).toBe(BOOK_ID_1);
    expect(draft.title).toBe('Capitulo 1');
    expect(draft.isItPublic).toBe(false);
  });

  it('updates existing draft preserving previous title when omitted', async () => {
    await sut.execute({
      userId: 'user-1',
      deviceId: 'web-chrome-1',
      bookId: BOOK_ID_1,
      title: 'Capitulo 1',
      text: 'Versao inicial',
      isItPublic: true,
    });

    const updated = await sut.execute({
      userId: 'user-1',
      deviceId: 'web-chrome-1',
      bookId: BOOK_ID_1,
      text: 'Versao revisada',
    });

    expect(updated.title).toBe('Capitulo 1');
    expect(updated.text).toBe('Versao revisada');
    expect(updated.isItPublic).toBe(true);
  });

  it('throws when book does not exist', async () => {
    await expect(
      sut.execute({
        userId: 'user-1',
        deviceId: 'web-chrome-1',
        bookId: 'missing-book-id',
        text: 'Texto',
      })
    ).rejects.toThrow('Book not found');
  });
});