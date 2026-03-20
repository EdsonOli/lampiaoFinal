import { Comment } from '../../core/domain/Comment';
import {
  CommentRepository,
  CreateCommentInput,
  UpdateCommentInput,
} from '../../core/ports/CommentRepository';
import { Comment as CommentModel } from '../models/CommentModel';

function mapComment(comment: CommentModel): Comment {
  return {
    id: comment.id,
    title: comment.title,
    text: comment.text,
    userId: comment.user_id,
    postId: comment.post_id,
  };
}

export class SequelizeCommentRepository implements CommentRepository {
  async findAll(): Promise<Comment[]> {
    const comments = await CommentModel.findAll();
    return comments.map(mapComment);
  }

  async create(input: CreateCommentInput): Promise<Comment> {
    const comment = await CommentModel.create({
      title: input.title,
      text: input.text,
      user_id: input.userId,
      post_id: input.postId,
    });

    return mapComment(comment);
  }

  async findById(id: number): Promise<Comment | null> {
    const comment = await CommentModel.findByPk(id);
    return comment ? mapComment(comment) : null;
  }

  async findByPostId(postId: number): Promise<Comment[]> {
    const comments = await CommentModel.findAll({ where: { post_id: postId } });
    return comments.map(mapComment);
  }

  async findByUserId(userId: number): Promise<Comment[]> {
    const comments = await CommentModel.findAll({ where: { user_id: userId } });
    return comments.map(mapComment);
  }

  async update(id: number, input: UpdateCommentInput): Promise<Comment | null> {
    const comment = await CommentModel.findByPk(id);
    if (!comment) {
      return null;
    }

    await comment.update({
      title: input.title ?? comment.title,
      text: input.text ?? comment.text,
    });

    return mapComment(comment);
  }

  async delete(id: number): Promise<void> {
    await CommentModel.destroy({ where: { id } });
  }
}
