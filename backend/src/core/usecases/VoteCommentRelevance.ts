import { Comment, CommentRelevanceVoteValue } from '../domain/Comment';
import { calculateCommentRelevanceScore } from '../domain/CommentRelevanceScore';
import { ForbiddenError, NotFoundError } from '../errors';
import { CommentRepository } from '../ports/CommentRepository';

export interface VoteCommentRelevanceInput {
  commentId: string;
  userId: string;
  value: CommentRelevanceVoteValue;
}

export class VoteCommentRelevance {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(input: VoteCommentRelevanceInput): Promise<Comment> {
    const comment = await this.commentRepository.findById(input.commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.userId === input.userId) {
      throw new ForbiddenError('You cannot vote on your own comment');
    }

    await this.commentRepository.upsertRelevanceVote({
      commentId: input.commentId,
      userId: input.userId,
      value: input.value,
    });

    const count = await this.commentRepository.countRelevanceVotes(input.commentId);
    const relevanceScore = calculateCommentRelevanceScore(count);

    const updatedComment = await this.commentRepository.updateRelevanceMetrics(
      input.commentId,
      count,
      relevanceScore
    );

    if (!updatedComment) {
      throw new NotFoundError('Comment not found');
    }

    return updatedComment;
  }
}