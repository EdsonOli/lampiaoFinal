import { Post } from '../../core/domain/Post';
import { CreatePostInput, PostRepository, UpdatePostInput } from '../../core/ports/PostRepository';
import { Post as PostModel } from '../models/PostModel';

function mapPost(post: PostModel): Post {
  return {
    id: post.id,
    title: post.title,
    text: post.text,
    isItPublic: post.is_it_public,
    userId: post.user_id,
    bookId: post.book_id,
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

  async findById(id: number): Promise<Post | null> {
    const post = await PostModel.findByPk(id);
    return post ? mapPost(post) : null;
  }

  async findByUserId(userId: number): Promise<Post[]> {
    const posts = await PostModel.findAll({ where: { user_id: userId } });
    return posts.map(mapPost);
  }

  async findByBookId(bookId: number): Promise<Post[]> {
    const posts = await PostModel.findAll({ where: { book_id: bookId } });
    return posts.map(mapPost);
  }

  async update(id: number, input: UpdatePostInput): Promise<Post | null> {
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

  async delete(id: number): Promise<void> {
    await PostModel.destroy({ where: { id } });
  }
}
