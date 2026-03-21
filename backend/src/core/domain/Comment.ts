export interface Comment {
  id: string;
  title: string;
  text: string;
  userId: string;
  postId: string;
  parentCommentId?: string | null;
  relevantVotes: number;
  lessRelevantVotes: number;
  relevanceScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CommentRelevanceVoteValue = 'relevant' | 'less_relevant';
