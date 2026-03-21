import { Comment, CommentRelevanceVoteValue } from '../domain/Comment';

export interface CreateCommentInput {
  title: string;
  text: string;
  userId: string;
  postId: string;
  parentCommentId?: string;
}

export interface UpdateCommentInput {
  title?: string;
  text?: string;
}

export interface CommentRelevanceVoteInput {
  commentId: string;
  userId: string;
  value: CommentRelevanceVoteValue;
}

export interface CommentRelevanceVoteCount {
  relevantVotes: number;
  lessRelevantVotes: number;
}

export interface CommentRepository {
  findAll(): Promise<Comment[]>;
  findById(id: string): Promise<Comment | null>;
  findByPostId(postId: string): Promise<Comment[]>;
  findByUserId(userId: string): Promise<Comment[]>;
  create(input: CreateCommentInput): Promise<Comment>;
  update(id: string, input: UpdateCommentInput): Promise<Comment | null>;
  upsertRelevanceVote(input: CommentRelevanceVoteInput): Promise<void>;
  findRelevanceVotesByUserForComments(
    userId: string,
    commentIds: string[]
  ): Promise<Record<string, CommentRelevanceVoteValue>>;
  countRelevanceVotes(commentId: string): Promise<CommentRelevanceVoteCount>;
  updateRelevanceMetrics(
    commentId: string,
    count: CommentRelevanceVoteCount,
    relevanceScore: number
  ): Promise<Comment | null>;
  delete(id: string): Promise<void>;
}
