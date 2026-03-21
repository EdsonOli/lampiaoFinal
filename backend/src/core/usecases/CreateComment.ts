import { Comment } from '../domain/Comment';
import { CommentRepository, CreateCommentInput } from '../ports/CommentRepository';
import { PostRepository } from '../ports/PostRepository';
import { NotFoundError } from '../errors';

export class CreateComment {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly postRepository: PostRepository
  ) {}

  async execute(input: CreateCommentInput): Promise<Comment> {
    const post = await this.postRepository.findById(input.postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (input.parentCommentId) {
      const parentComment = await this.commentRepository.findById(input.parentCommentId);
      if (parentComment?.postId !== input.postId) {
        throw new NotFoundError('Parent comment not found');
      }
    }

    return this.commentRepository.create(input);
  }
}
