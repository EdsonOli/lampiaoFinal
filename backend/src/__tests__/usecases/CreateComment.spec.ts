import { CreateComment } from '../../core/usecases/CreateComment';
import { InMemoryCommentRepository } from '../fakes/InMemoryCommentRepository';
import { InMemoryPostRepository } from '../fakes/InMemoryPostRepository';

describe('CreateComment', () => {
  let commentRepo: InMemoryCommentRepository;
  let postRepo: InMemoryPostRepository;
  let sut: CreateComment;

  beforeEach(async () => {
    commentRepo = new InMemoryCommentRepository();
    postRepo = new InMemoryPostRepository();
    sut = new CreateComment(commentRepo, postRepo);

    // Cria um post de referência diretamente no repositório
    await postRepo.create({
      title: 'Post de teste',
      text: 'Conteúdo.',
      userId: 1,
      bookId: 1,
    });
  });

  it('should create a comment on a valid post', async () => {
    const comment = await sut.execute({
      title: 'Ótimo post!',
      text: 'Concordo com tudo.',
      userId: 2,
      postId: 1,
    });

    expect(comment.id).toBe(1);
    expect(comment.title).toBe('Ótimo post!');
    expect(comment.postId).toBe(1);
    expect(comment.userId).toBe(2);
  });

  it('should throw when postId does not exist', async () => {
    await expect(
      sut.execute({
        title: 'Comentário inválido',
        text: 'Post inexistente.',
        userId: 1,
        postId: 999,
      })
    ).rejects.toThrow('Post not found');
  });

  it('should allow multiple comments on the same post', async () => {
    await sut.execute({ title: 'C1', text: 'Texto 1', userId: 1, postId: 1 });
    await sut.execute({ title: 'C2', text: 'Texto 2', userId: 2, postId: 1 });

    const comments = await commentRepo.findByPostId(1);
    expect(comments).toHaveLength(2);
  });
});
