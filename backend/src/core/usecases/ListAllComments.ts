import { Comment } from '../domain/Comment';
import { CommentRepository } from '../ports/CommentRepository';

export class ListAllComments {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(): Promise<Comment[]> {
    return this.commentRepository.findAll();
  }
}
