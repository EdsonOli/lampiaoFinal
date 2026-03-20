import { CreatePost } from '../../core/usecases/CreatePost';
import { InMemoryBookRepository } from '../../adapters/repositories/InMemoryBookRepository';
import { InMemoryPostRepository } from '../fakes/InMemoryPostRepository';

describe('CreatePost', () => {
  const BOOK_ID_1 = '550e8400-e29b-41d4-a716-446655440000';
  const BOOK_ID_2 = '550e8400-e29b-41d4-a716-446655440001';
  let bookRepo: InMemoryBookRepository;
  let postRepo: InMemoryPostRepository;
  let sut: CreatePost;

  beforeEach(() => {
    bookRepo = new InMemoryBookRepository();
    postRepo = new InMemoryPostRepository();
    sut = new CreatePost(postRepo, bookRepo);
  });

  it('should create a post for a valid book', async () => {
    const post = await sut.execute({
      title: 'Minha resenha',
      text: 'O livro é incrível.',
      userId: 'user-1',
      bookId: BOOK_ID_1,
    });

    expect(post.id).toEqual(expect.any(String));
    expect(post.title).toBe('Minha resenha');
    expect(post.userId).toBe('user-1');
    expect(post.bookId).toBe(BOOK_ID_1);
  });

  it('should throw when bookId does not exist', async () => {
    await expect(
      sut.execute({
        title: 'Post inválido',
        text: 'Livro inexistente.',
        userId: 'user-1',
        bookId: 'book-missing',
      })
    ).rejects.toThrow('Book not found');
  });

  it('should default isItPublic to true', async () => {
    const post = await sut.execute({
      title: 'Post público',
      text: 'Texto.',
      userId: 'user-1',
      bookId: BOOK_ID_2,
    });

    expect(post.isItPublic).toBe(true);
  });

  it('should respect isItPublic=false when explicitly set', async () => {
    const post = await sut.execute({
      title: 'Post privado',
      text: 'Texto.',
      userId: 'user-1',
      bookId: BOOK_ID_1,
      isItPublic: false,
    });

    expect(post.isItPublic).toBe(false);
  });
});
