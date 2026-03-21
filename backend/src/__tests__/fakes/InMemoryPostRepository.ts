import { Post } from '../../core/domain/Post';
import { CreatePostInput, PostCursor, PostRepository, UpdatePostInput } from '../../core/ports/PostRepository';
import { randomUUID } from 'crypto';

export class InMemoryPostRepository implements PostRepository {
  private posts: Post[] = [];

  async findAll(): Promise<Post[]> {
    return [...this.posts];
  }

  async findById(id: string): Promise<Post | null> {
    return this.posts.find(p => p.id === id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Post[]> {
    const idSet = new Set(ids);
    return this.posts.filter(post => idSet.has(post.id));
  }

  async findByUserId(userId: string): Promise<Post[]> {
    return this.posts.filter(p => p.userId === userId);
  }

  async findByBookId(bookId: string): Promise<Post[]> {
    return this.posts.filter(p => p.bookId === bookId);
  }

  async findPublicByBookIds(
    bookIds: string[],
    options?: { limit?: number; cursor?: PostCursor }
  ): Promise<Post[]> {
    const idSet = new Set(bookIds);
    const limit = Math.max(1, Math.min(100, options?.limit ?? 20));
    const cursor = options?.cursor;

    const sorted = this.posts
      .filter(post => idSet.has(post.bookId) && post.isItPublic)
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() ?? 0;
        const bTime = b.createdAt?.getTime() ?? 0;
        if (bTime !== aTime) {
          return bTime - aTime;
        }
        return b.id.localeCompare(a.id);
      });

    const cursorFiltered = cursor
      ? sorted.filter(post => {
          const postTime = post.createdAt?.getTime() ?? 0;
          const cursorTime = cursor.createdAt.getTime();
          if (postTime < cursorTime) {
            return true;
          }
          if (postTime > cursorTime) {
            return false;
          }
          return post.id < cursor.id;
        })
      : sorted;

    return cursorFiltered.slice(0, limit);
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
