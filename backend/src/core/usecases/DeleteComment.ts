import { CommentRepository } from '../ports/CommentRepository';
import { NotFoundError, ForbiddenError } from '../errors';

export class DeleteComment {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenError('Forbidden comment access');
    }

    await this.commentRepository.delete(id);
  }
}
