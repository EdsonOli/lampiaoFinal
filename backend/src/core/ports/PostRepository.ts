import { Post } from '../domain/Post';

export interface CreatePostInput {
  title: string;
  text: string;
  isItPublic?: boolean;
  userId: number;
  bookId: number;
}

export interface UpdatePostInput {
  title?: string;
  text?: string;
  isItPublic?: boolean;
}

export interface PostRepository {
  findAll(): Promise<Post[]>;
  findById(id: number): Promise<Post | null>;
  findByUserId(userId: number): Promise<Post[]>;
  findByBookId(bookId: number): Promise<Post[]>;
  create(input: CreatePostInput): Promise<Post>;
  update(id: number, input: UpdatePostInput): Promise<Post | null>;
  delete(id: number): Promise<void>;
}
