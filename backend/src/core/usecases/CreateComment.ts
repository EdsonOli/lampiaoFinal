import { Comment } from '../domain/Comment';
import { CommentRepository, CreateCommentInput } from '../ports/CommentRepository';
import { PostRepository } from '../ports/PostRepository';

export class CreateComment {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly postRepository: PostRepository
  ) {}

  async execute(input: CreateCommentInput): Promise<Comment> {
    const post = await this.postRepository.findById(input.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    return this.commentRepository.create(input);
  }
}
