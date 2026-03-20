import { CreatePost } from '../../core/usecases/CreatePost';
import { InMemoryBookRepository } from '../../adapters/repositories/InMemoryBookRepository';
import { InMemoryPostRepository } from '../fakes/InMemoryPostRepository';

describe('CreatePost', () => {
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
      userId: 1,
      bookId: 1, // "O Cortiço" — existe no InMemoryBookRepository
    });

    expect(post.id).toBe(1);
    expect(post.title).toBe('Minha resenha');
    expect(post.userId).toBe(1);
    expect(post.bookId).toBe(1);
  });

  it('should throw when bookId does not exist', async () => {
    await expect(
      sut.execute({
        title: 'Post inválido',
        text: 'Livro inexistente.',
        userId: 1,
        bookId: 999,
      })
    ).rejects.toThrow('Book not found');
  });

  it('should default isItPublic to true', async () => {
    const post = await sut.execute({
      title: 'Post público',
      text: 'Texto.',
      userId: 1,
      bookId: 2,
    });

    expect(post.isItPublic).toBe(true);
  });

  it('should respect isItPublic=false when explicitly set', async () => {
    const post = await sut.execute({
      title: 'Post privado',
      text: 'Texto.',
      userId: 1,
      bookId: 1,
      isItPublic: false,
    });

    expect(post.isItPublic).toBe(false);
  });
});
