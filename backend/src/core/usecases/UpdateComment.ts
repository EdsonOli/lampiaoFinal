import { Comment } from '../domain/Comment';
import { CommentRepository, UpdateCommentInput } from '../ports/CommentRepository';

export class UpdateComment {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(id: number, userId: number, input: UpdateCommentInput): Promise<Comment> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('Forbidden comment access');
    }

    const updatedComment = await this.commentRepository.update(id, input);
    if (!updatedComment) {
      throw new Error('Comment not found');
    }

    return updatedComment;
  }
}
