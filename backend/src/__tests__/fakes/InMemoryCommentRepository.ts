import { Comment } from '../../core/domain/Comment';
import {
  CommentRelevanceVoteCount,
  CommentRelevanceVoteInput,
  CommentRepository,
  CreateCommentInput,
  UpdateCommentInput,
} from '../../core/ports/CommentRepository';
import { randomUUID } from 'node:crypto';

export class InMemoryCommentRepository implements CommentRepository {
  private comments: Comment[] = [];
  private readonly votes = new Map<string, Map<string, 'relevant' | 'less_relevant'>>();

  async findAll(): Promise<Comment[]> {
    return [...this.comments];
  }

  async findById(id: string): Promise<Comment | null> {
    return this.comments.find(c => c.id === id) ?? null;
  }

  async findByPostId(postId: string): Promise<Comment[]> {
    return this.comments.filter(c => c.postId === postId);
  }

  async findByUserId(userId: string): Promise<Comment[]> {
    return this.comments.filter(c => c.userId === userId);
  }

  async create(input: CreateCommentInput): Promise<Comment> {
    const now = new Date();
    const comment: Comment = {
      id: randomUUID(),
      ...input,
      parentCommentId: input.parentCommentId ?? null,
      relevantVotes: 0,
      lessRelevantVotes: 0,
      relevanceScore: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.comments.push(comment);
    return comment;
  }

  async update(id: string, input: UpdateCommentInput): Promise<Comment | null> {
    const idx = this.comments.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.comments[idx] = { ...this.comments[idx], ...input, updatedAt: new Date() };
    return this.comments[idx];
  }

  async upsertRelevanceVote(input: CommentRelevanceVoteInput): Promise<void> {
    const commentVotes = this.votes.get(input.commentId) ?? new Map<string, 'relevant' | 'less_relevant'>();
    commentVotes.set(input.userId, input.value);
    this.votes.set(input.commentId, commentVotes);
  }

  async findRelevanceVotesByUserForComments(
    userId: string,
    commentIds: string[]
  ): Promise<Record<string, 'relevant' | 'less_relevant'>> {
    const lookup = new Set(commentIds);
    const result: Record<string, 'relevant' | 'less_relevant'> = {};

    for (const [commentId, votes] of this.votes.entries()) {
      if (!lookup.has(commentId)) {
        continue;
      }

      const vote = votes.get(userId);
      if (vote) {
        result[commentId] = vote;
      }
    }

    return result;
  }

  async countRelevanceVotes(commentId: string): Promise<CommentRelevanceVoteCount> {
    const commentVotes = this.votes.get(commentId);
    if (!commentVotes) {
      return { relevantVotes: 0, lessRelevantVotes: 0 };
    }

    let relevantVotes = 0;
    let lessRelevantVotes = 0;
    for (const vote of commentVotes.values()) {
      if (vote === 'relevant') {
        relevantVotes += 1;
      } else {
        lessRelevantVotes += 1;
      }
    }

    return { relevantVotes, lessRelevantVotes };
  }

  async updateRelevanceMetrics(
    commentId: string,
    count: CommentRelevanceVoteCount,
    relevanceScore: number
  ): Promise<Comment | null> {
    const idx = this.comments.findIndex(c => c.id === commentId);
    if (idx === -1) {
      return null;
    }

    this.comments[idx] = {
      ...this.comments[idx],
      relevantVotes: count.relevantVotes,
      lessRelevantVotes: count.lessRelevantVotes,
      relevanceScore,
      updatedAt: new Date(),
    };

    return this.comments[idx];
  }

  async delete(id: string): Promise<void> {
    this.comments = this.comments.filter(c => c.id !== id);
  }
}
