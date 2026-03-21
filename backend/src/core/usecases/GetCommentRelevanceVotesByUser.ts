import { CommentRelevanceVoteValue } from '../domain/Comment';
import { CommentRepository } from '../ports/CommentRepository';

export class GetCommentRelevanceVotesByUser {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(
    userId: string,
    commentIds: string[]
  ): Promise<Record<string, CommentRelevanceVoteValue>> {
    return this.commentRepository.findRelevanceVotesByUserForComments(userId, commentIds);
  }
}
