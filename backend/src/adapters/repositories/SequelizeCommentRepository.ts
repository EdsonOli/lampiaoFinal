import { Comment } from '../../core/domain/Comment';
import {
  CommentRelevanceVoteCount,
  CommentRelevanceVoteInput,
  CommentRepository,
  CreateCommentInput,
  UpdateCommentInput,
} from '../../core/ports/CommentRepository';
import sequelize from '../../config/database';
import { Op } from 'sequelize';
import { Comment as CommentModel } from '../models/CommentModel';
import { CommentRelevanceVote as CommentRelevanceVoteModel } from '../models/CommentRelevanceVoteModel';

function mapComment(comment: CommentModel): Comment {
  return {
    id: comment.id,
    title: comment.title,
    text: comment.text,
    userId: comment.user_id,
    postId: comment.post_id,
    parentCommentId: comment.parent_comment_id,
    relevantVotes: comment.relevant_votes,
    lessRelevantVotes: comment.less_relevant_votes,
    relevanceScore: comment.relevance_score,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

export class SequelizeCommentRepository implements CommentRepository {
  async findAll(): Promise<Comment[]> {
    const comments = await CommentModel.findAll({ order: [['createdAt', 'ASC']] });
    return comments.map(mapComment);
  }

  async create(input: CreateCommentInput): Promise<Comment> {
    const comment = await CommentModel.create({
      title: input.title,
      text: input.text,
      user_id: input.userId,
      post_id: input.postId,
      parent_comment_id: input.parentCommentId ?? null,
    });

    return mapComment(comment);
  }

  async findById(id: string): Promise<Comment | null> {
    const comment = await CommentModel.findByPk(id);
    return comment ? mapComment(comment) : null;
  }

  async findByPostId(postId: string): Promise<Comment[]> {
    const comments = await CommentModel.findAll({
      where: { post_id: postId },
      order: [['createdAt', 'ASC']],
    });
    return comments.map(mapComment);
  }

  async findByUserId(userId: string): Promise<Comment[]> {
    const comments = await CommentModel.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'ASC']],
    });
    return comments.map(mapComment);
  }

  async upsertRelevanceVote(input: CommentRelevanceVoteInput): Promise<void> {
    await sequelize.transaction(async transaction => {
      const existingVote = await CommentRelevanceVoteModel.findOne({
        where: {
          comment_id: input.commentId,
          user_id: input.userId,
        },
        transaction,
      });

      if (existingVote) {
        if (existingVote.value !== input.value) {
          await existingVote.update({ value: input.value }, { transaction });
        }
        return;
      }

      await CommentRelevanceVoteModel.create(
        {
          comment_id: input.commentId,
          user_id: input.userId,
          value: input.value,
        },
        { transaction }
      );
    });
  }

  async findRelevanceVotesByUserForComments(
    userId: string,
    commentIds: string[]
  ): Promise<Record<string, 'relevant' | 'less_relevant'>> {
    if (commentIds.length === 0) {
      return {};
    }

    const votes = await CommentRelevanceVoteModel.findAll({
      where: {
        user_id: userId,
        comment_id: {
          [Op.in]: commentIds,
        },
      },
    });

    return votes.reduce<Record<string, 'relevant' | 'less_relevant'>>((acc, vote) => {
      acc[vote.comment_id] = vote.value;
      return acc;
    }, {});
  }

  async countRelevanceVotes(commentId: string): Promise<CommentRelevanceVoteCount> {
    const [relevantVotes, lessRelevantVotes] = await Promise.all([
      CommentRelevanceVoteModel.count({ where: { comment_id: commentId, value: 'relevant' } }),
      CommentRelevanceVoteModel.count({ where: { comment_id: commentId, value: 'less_relevant' } }),
    ]);

    return {
      relevantVotes,
      lessRelevantVotes,
    };
  }

  async updateRelevanceMetrics(
    commentId: string,
    count: CommentRelevanceVoteCount,
    relevanceScore: number
  ): Promise<Comment | null> {
    const comment = await CommentModel.findByPk(commentId);
    if (!comment) {
      return null;
    }

    await comment.update({
      relevant_votes: count.relevantVotes,
      less_relevant_votes: count.lessRelevantVotes,
      relevance_score: relevanceScore,
    });

    return mapComment(comment);
  }

  async update(id: string, input: UpdateCommentInput): Promise<Comment | null> {
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

  async delete(id: string): Promise<void> {
    await CommentModel.destroy({ where: { id } });
  }
}
