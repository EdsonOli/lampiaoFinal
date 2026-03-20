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

export interface PostRepository {
  findAll(): Promise<Post[]>;
  findById(id: string): Promise<Post | null>;
  findByUserId(userId: string): Promise<Post[]>;
  findByBookId(bookId: string): Promise<Post[]>;
  create(input: CreatePostInput): Promise<Post>;
  update(id: string, input: UpdatePostInput): Promise<Post | null>;
  delete(id: string): Promise<void>;
}
