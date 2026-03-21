import { Comment } from '../domain/Comment';
import { CommentRepository } from '../ports/CommentRepository';

export interface CommentTreeNode extends Comment {
  children: CommentTreeNode[];
}

function compareByRelevance(a: Comment, b: Comment): number {
  if (b.relevanceScore !== a.relevanceScore) {
    return b.relevanceScore - a.relevanceScore;
  }

  if (b.relevantVotes !== a.relevantVotes) {
    return b.relevantVotes - a.relevantVotes;
  }

  return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
}

export class ListCommentTreeByPost {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(postId: string): Promise<CommentTreeNode[]> {
    const comments = await this.commentRepository.findByPostId(postId);
    const nodeById = new Map<string, CommentTreeNode>();
    const roots: CommentTreeNode[] = [];

    for (const comment of comments) {
      nodeById.set(comment.id, {
        ...comment,
        children: [],
      });
    }

    for (const comment of comments) {
      const node = nodeById.get(comment.id);
      if (!node) {
        continue;
      }

      if (!comment.parentCommentId) {
        roots.push(node);
        continue;
      }

      const parent = nodeById.get(comment.parentCommentId);
      if (!parent) {
        roots.push(node);
        continue;
      }

      parent.children.push(node);
    }

    const sortTree = (nodes: CommentTreeNode[]): void => {
      nodes.sort(compareByRelevance);
      nodes.forEach(node => sortTree(node.children));
    };

    sortTree(roots);
    return roots;
  }
}
