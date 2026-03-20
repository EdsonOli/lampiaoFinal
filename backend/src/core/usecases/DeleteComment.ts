import { CommentRepository } from '../ports/CommentRepository';

export class DeleteComment {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(id: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('Forbidden comment access');
    }

    await this.commentRepository.delete(id);
  }
}
