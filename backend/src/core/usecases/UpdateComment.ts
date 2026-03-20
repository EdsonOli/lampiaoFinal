import { Comment } from '../domain/Comment';
import { CommentRepository, UpdateCommentInput } from '../ports/CommentRepository';
import { NotFoundError, ForbiddenError } from '../errors';

export class UpdateComment {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(id: string, userId: string, input: UpdateCommentInput): Promise<Comment> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenError('Forbidden comment access');
    }

    const updatedComment = await this.commentRepository.update(id, input);
    if (!updatedComment) {
      throw new NotFoundError('Comment not found');
    }

    return updatedComment;
  }
}
