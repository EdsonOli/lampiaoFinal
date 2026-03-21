import { Post } from '../domain/Post';

export interface CreatePostInput {
  title: string;
  text: string;
  isItPublic?: boolean;
  userId: string;
  bookId: string;
}

export interface UpdatePostInput {
  title?: string;
  text?: string;
  isItPublic?: boolean;
}

export interface PostCursor {
  createdAt: Date;
  id: string;
}

export interface PostRepository {
  findAll(): Promise<Post[]>;
  findById(id: string): Promise<Post | null>;
  findByIds(ids: string[]): Promise<Post[]>;
  findByUserId(userId: string): Promise<Post[]>;
  findByBookId(bookId: string): Promise<Post[]>;
  findPublicByBookIds(bookIds: string[], options?: { limit?: number; cursor?: PostCursor }): Promise<Post[]>;
  create(input: CreatePostInput): Promise<Post>;
  update(id: string, input: UpdatePostInput): Promise<Post | null>;
  delete(id: string): Promise<void>;
}
