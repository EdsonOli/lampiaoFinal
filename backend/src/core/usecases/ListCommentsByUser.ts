import { Comment } from '../domain/Comment';
import { CommentRepository } from '../ports/CommentRepository';

export class ListCommentsByUser {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(userId: string): Promise<Comment[]> {
    return this.commentRepository.findByUserId(userId);
  }
}
