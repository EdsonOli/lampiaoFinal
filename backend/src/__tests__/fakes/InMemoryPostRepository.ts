import { Post } from '../../core/domain/Post';
import { CreatePostInput, PostRepository, UpdatePostInput } from '../../core/ports/PostRepository';

export class InMemoryPostRepository implements PostRepository {
  private posts: Post[] = [];
  private counter = 1;

  async findAll(): Promise<Post[]> {
    return [...this.posts];
  }

  async findById(id: number): Promise<Post | null> {
    return this.posts.find(p => p.id === id) ?? null;
  }

  async findByUserId(userId: number): Promise<Post[]> {
    return this.posts.filter(p => p.userId === userId);
  }

  async findByBookId(bookId: number): Promise<Post[]> {
    return this.posts.filter(p => p.bookId === bookId);
  }

  async create(input: CreatePostInput): Promise<Post> {
    const post: Post = {
      id: this.counter++,
      isItPublic: true,
      ...input,
    };
    this.posts.push(post);
    return post;
  }

  async update(id: number, input: UpdatePostInput): Promise<Post | null> {
    const idx = this.posts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.posts[idx] = { ...this.posts[idx], ...input };
    return this.posts[idx];
  }

  async delete(id: number): Promise<void> {
    this.posts = this.posts.filter(p => p.id !== id);
  }
}
