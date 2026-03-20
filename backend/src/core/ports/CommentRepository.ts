import { Comment } from '../domain/Comment';

export interface CreateCommentInput {
  title: string;
  text: string;
  userId: number;
  postId: number;
}

export interface UpdateCommentInput {
  title?: string;
  text?: string;
}

export interface CommentRepository {
  findAll(): Promise<Comment[]>;
  findById(id: number): Promise<Comment | null>;
  findByPostId(postId: number): Promise<Comment[]>;
  findByUserId(userId: number): Promise<Comment[]>;
  create(input: CreateCommentInput): Promise<Comment>;
  update(id: number, input: UpdateCommentInput): Promise<Comment | null>;
  delete(id: number): Promise<void>;
}
