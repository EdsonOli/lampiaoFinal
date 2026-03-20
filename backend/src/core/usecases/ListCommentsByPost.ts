import { Comment } from '../domain/Comment';
import { CommentRepository } from '../ports/CommentRepository';

export class ListCommentsByPost {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(postId: string): Promise<Comment[]> {
    return this.commentRepository.findByPostId(postId);
  }
}
