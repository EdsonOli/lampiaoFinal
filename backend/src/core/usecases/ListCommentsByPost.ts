import { Comment } from '../domain/Comment';
import { CommentRepository } from '../ports/CommentRepository';

export class ListCommentsByPost {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(postId: string): Promise<Comment[]> {
    const comments = await this.commentRepository.findByPostId(postId);

    const childrenByParent = new Map<string | null, Comment[]>();
    for (const comment of comments) {
      const parentId = comment.parentCommentId ?? null;
      const current = childrenByParent.get(parentId) ?? [];
      current.push(comment);
      childrenByParent.set(parentId, current);
    }

    const sorted: Comment[] = [];
    const visit = (parentId: string | null): void => {
      const children = childrenByParent.get(parentId) ?? [];
      children.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }

        if (b.relevantVotes !== a.relevantVotes) {
          return b.relevantVotes - a.relevantVotes;
        }

        return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
      });

      children.forEach(child => {
        sorted.push(child);
        visit(child.id);
      });
    };

    visit(null);
    return sorted;
  }
}
