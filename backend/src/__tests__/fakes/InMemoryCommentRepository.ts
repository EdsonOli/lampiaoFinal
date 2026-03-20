import { Comment } from '../../core/domain/Comment';
import { CommentRepository, CreateCommentInput, UpdateCommentInput } from '../../core/ports/CommentRepository';

export class InMemoryCommentRepository implements CommentRepository {
  private comments: Comment[] = [];
  private counter = 1;

  async findAll(): Promise<Comment[]> {
    return [...this.comments];
  }

  async findById(id: number): Promise<Comment | null> {
    return this.comments.find(c => c.id === id) ?? null;
  }

  async findByPostId(postId: number): Promise<Comment[]> {
    return this.comments.filter(c => c.postId === postId);
  }

  async findByUserId(userId: number): Promise<Comment[]> {
    return this.comments.filter(c => c.userId === userId);
  }

  async create(input: CreateCommentInput): Promise<Comment> {
    const comment: Comment = { id: this.counter++, ...input };
    this.comments.push(comment);
    return comment;
  }

  async update(id: number, input: UpdateCommentInput): Promise<Comment | null> {
    const idx = this.comments.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.comments[idx] = { ...this.comments[idx], ...input };
    return this.comments[idx];
  }

  async delete(id: number): Promise<void> {
    this.comments = this.comments.filter(c => c.id !== id);
  }
}
