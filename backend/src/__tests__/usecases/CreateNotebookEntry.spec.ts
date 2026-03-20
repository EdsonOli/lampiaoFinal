import { CreateNotebookEntry } from '../../core/usecases/CreateNotebookEntry';
import { InMemoryBookRepository } from '../../adapters/repositories/InMemoryBookRepository';
import { InMemoryNotebookRepository } from '../fakes/InMemoryNotebookRepository';

describe('CreateNotebookEntry', () => {
  const BOOK_ID_1 = '550e8400-e29b-41d4-a716-446655440000';
  const BOOK_ID_2 = '550e8400-e29b-41d4-a716-446655440001';
  let bookRepo: InMemoryBookRepository;
  let notebookRepo: InMemoryNotebookRepository;
  let sut: CreateNotebookEntry;

  beforeEach(() => {
    bookRepo = new InMemoryBookRepository();
    notebookRepo = new InMemoryNotebookRepository();
    sut = new CreateNotebookEntry(notebookRepo, bookRepo);
  });

  it('should create a notebook entry for a valid book', async () => {
    const entry = await sut.execute({
      userId: 'user-1',
      bookId: BOOK_ID_1,
      status: 'Lendo',
    });

    expect(entry.id).toEqual(expect.any(String));
    expect(entry.userId).toBe('user-1');
    expect(entry.bookId).toBe(BOOK_ID_1);
    expect(entry.status).toBe('Lendo');
    expect(entry.favorite).toBe(false);
  });

  it('should throw when bookId does not exist', async () => {
    await expect(
      sut.execute({ userId: 'user-1', bookId: 'book-missing', status: 'Lido' })
    ).rejects.toThrow('Book not found');
  });

  it('should throw when the same user already has an entry for that book', async () => {
    await sut.execute({ userId: 'user-1', bookId: BOOK_ID_1, status: 'Quero ler' });

    await expect(
      sut.execute({ userId: 'user-1', bookId: BOOK_ID_1, status: 'Lendo' })
    ).rejects.toThrow('Notebook entry already exists');
  });

  it('should allow different users to have entries for the same book', async () => {
    await sut.execute({ userId: 'user-1', bookId: BOOK_ID_1, status: 'Lido' });
    const entry = await sut.execute({ userId: 'user-2', bookId: BOOK_ID_1, status: 'Lendo' });

    expect(entry.userId).toBe('user-2');
  });

  it('should preserve optional grade and favorite fields', async () => {
    const entry = await sut.execute({
      userId: 'user-1',
      bookId: BOOK_ID_2,
      status: 'Lido',
      grade: 5,
      favorite: true,
    });

    expect(entry.grade).toBe(5);
    expect(entry.favorite).toBe(true);
  });
});
