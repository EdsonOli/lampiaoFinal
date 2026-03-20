import { Comment } from '../domain/Comment';

export interface CreateCommentInput {
  title: string;
  text: string;
  userId: string;
  postId: string;
}

export interface UpdateCommentInput {
  title?: string;
  text?: string;
}

export interface CommentRepository {
  findAll(): Promise<Comment[]>;
  findById(id: string): Promise<Comment | null>;
  findByPostId(postId: string): Promise<Comment[]>;
  findByUserId(userId: string): Promise<Comment[]>;
  create(input: CreateCommentInput): Promise<Comment>;
  update(id: string, input: UpdateCommentInput): Promise<Comment | null>;
  delete(id: string): Promise<void>;
}
