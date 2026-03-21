import { Comment, CommentRelevanceVoteValue } from '../../core/domain/Comment';
import { CommentTreeNode } from '../../core/usecases/ListCommentTreeByPost';

export interface CommentWithViewerVote extends Comment {
  myVote?: CommentRelevanceVoteValue;
}

export interface CommentTreeNodeWithViewerVote extends CommentWithViewerVote {
  children: CommentTreeNodeWithViewerVote[];
}

export function toCommentListWithViewerVote(
  comments: Comment[],
  votesByCommentId: Record<string, CommentRelevanceVoteValue>
): CommentWithViewerVote[] {
  return comments.map(comment => ({
    ...comment,
    myVote: votesByCommentId[comment.id],
  }));
}

export function toCommentTreeWithViewerVote(
  tree: CommentTreeNode[],
  votesByCommentId: Record<string, CommentRelevanceVoteValue>
): CommentTreeNodeWithViewerVote[] {
  const mapNode = (node: CommentTreeNode): CommentTreeNodeWithViewerVote => ({
    ...node,
    myVote: votesByCommentId[node.id],
    children: node.children.map(mapNode),
  });

  return tree.map(mapNode);
}
