import { Comment } from '../domain/Comment';
import { CommentRepository } from '../ports/CommentRepository';

export class GetCommentById {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(id: number): Promise<Comment | null> {
    return this.commentRepository.findById(id);
  }
}
