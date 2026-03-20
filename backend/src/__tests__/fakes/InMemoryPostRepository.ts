import { Post } from '../../core/domain/Post';
import { CreatePostInput, PostRepository, UpdatePostInput } from '../../core/ports/PostRepository';
import { randomUUID } from 'crypto';

export class InMemoryPostRepository implements PostRepository {
  private posts: Post[] = [];

  async findAll(): Promise<Post[]> {
    return [...this.posts];
  }

  async findById(id: string): Promise<Post | null> {
    return this.posts.find(p => p.id === id) ?? null;
  }

  async findByUserId(userId: string): Promise<Post[]> {
    return this.posts.filter(p => p.userId === userId);
  }

  async findByBookId(bookId: string): Promise<Post[]> {
    return this.posts.filter(p => p.bookId === bookId);
  }

  async create(input: CreatePostInput): Promise<Post> {
    const post: Post = {
      id: randomUUID(),
      isItPublic: true,
      ...input,
    };
    this.posts.push(post);
    return post;
  }

  async update(id: string, input: UpdatePostInput): Promise<Post | null> {
    const idx = this.posts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.posts[idx] = { ...this.posts[idx], ...input };
    return this.posts[idx];
  }

  async delete(id: string): Promise<void> {
    this.posts = this.posts.filter(p => p.id !== id);
  }
}
