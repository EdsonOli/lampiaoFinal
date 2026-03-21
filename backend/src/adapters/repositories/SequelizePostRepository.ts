import { Post } from '../../core/domain/Post';
import { CreatePostInput, PostCursor, PostRepository, UpdatePostInput } from '../../core/ports/PostRepository';
import { Op } from 'sequelize';
import { Post as PostModel } from '../models/PostModel';

function mapPost(post: PostModel): Post {
  return {
    id: post.id,
    title: post.title,
    text: post.text,
    isItPublic: post.is_it_public,
    userId: post.user_id,
    bookId: post.book_id,
    createdAt: (post as unknown as { createdAt?: Date }).createdAt,
    updatedAt: (post as unknown as { updatedAt?: Date }).updatedAt,
  };
}

export class SequelizePostRepository implements PostRepository {
  async findAll(): Promise<Post[]> {
    const posts = await PostModel.findAll();
    return posts.map(mapPost);
  }

  async create(input: CreatePostInput): Promise<Post> {
    const post = await PostModel.create({
      title: input.title,
      text: input.text,
      is_it_public: input.isItPublic ?? true,
      user_id: input.userId,
      book_id: input.bookId,
    });

    return mapPost(post);
  }

  async findById(id: string): Promise<Post | null> {
    const post = await PostModel.findByPk(id);
    return post ? mapPost(post) : null;
  }

  async findByIds(ids: string[]): Promise<Post[]> {
    if (ids.length === 0) {
      return [];
    }

    const posts = await PostModel.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    });

    return posts.map(mapPost);
  }

  async findByUserId(userId: string): Promise<Post[]> {
    const posts = await PostModel.findAll({ where: { user_id: userId } });
    return posts.map(mapPost);
  }

  async findByBookId(bookId: string): Promise<Post[]> {
    const posts = await PostModel.findAll({ where: { book_id: bookId } });
    return posts.map(mapPost);
  }

  async findPublicByBookIds(
    bookIds: string[],
    options?: { limit?: number; cursor?: PostCursor }
  ): Promise<Post[]> {
    if (bookIds.length === 0) {
      return [];
    }

    const limit = Math.max(1, Math.min(100, options?.limit ?? 20));
    const cursor = options?.cursor;

    const whereCursor = cursor
      ? {
          [Op.or]: [
            { createdAt: { [Op.lt]: cursor.createdAt } },
            {
              [Op.and]: [{ createdAt: cursor.createdAt }, { id: { [Op.lt]: cursor.id } }],
            },
          ],
        }
      : {};

    const posts = await PostModel.findAll({
      where: {
        book_id: {
          [Op.in]: bookIds,
        },
        is_it_public: true,
        ...whereCursor,
      },
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
    });

    return posts.map(mapPost);
  }

  async update(id: string, input: UpdatePostInput): Promise<Post | null> {
    const post = await PostModel.findByPk(id);
    if (!post) {
      return null;
    }

    await post.update({
      title: input.title ?? post.title,
      text: input.text ?? post.text,
      is_it_public: input.isItPublic ?? post.is_it_public,
    });

    return mapPost(post);
  }

  async delete(id: string): Promise<void> {
    await PostModel.destroy({ where: { id } });
  }
}
