import { CreateComment } from '../../core/usecases/CreateComment';
import { InMemoryCommentRepository } from '../fakes/InMemoryCommentRepository';
import { InMemoryPostRepository } from '../fakes/InMemoryPostRepository';

describe('CreateComment', () => {
  let commentRepo: InMemoryCommentRepository;
  let postRepo: InMemoryPostRepository;
  let sut: CreateComment;
  let postId: string;

  beforeEach(async () => {
    commentRepo = new InMemoryCommentRepository();
    postRepo = new InMemoryPostRepository();
    sut = new CreateComment(commentRepo, postRepo);

    // Cria um post de referência diretamente no repositório
    const post = await postRepo.create({
      title: 'Post de teste',
      text: 'Conteúdo.',
      userId: 'user-1',
      bookId: 'book-1',
    });
    postId = post.id;
  });

  it('should create a comment on a valid post', async () => {
    const comment = await sut.execute({
      title: 'Ótimo post!',
      text: 'Concordo com tudo.',
      userId: 'user-2',
      postId,
    });

    expect(comment.id).toEqual(expect.any(String));
    expect(comment.title).toBe('Ótimo post!');
    expect(comment.postId).toBe(postId);
    expect(comment.userId).toBe('user-2');
  });

  it('should throw when postId does not exist', async () => {
    await expect(
      sut.execute({
        title: 'Comentário inválido',
        text: 'Post inexistente.',
        userId: 'user-1',
        postId: 'post-missing',
      })
    ).rejects.toThrow('Post not found');
  });

  it('should allow multiple comments on the same post', async () => {
    await sut.execute({ title: 'C1', text: 'Texto 1', userId: 'user-1', postId });
    await sut.execute({ title: 'C2', text: 'Texto 2', userId: 'user-2', postId });

    const comments = await commentRepo.findByPostId(postId);
    expect(comments).toHaveLength(2);
  });
});
