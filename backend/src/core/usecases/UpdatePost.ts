import { Post } from '../domain/Post';
import { PostRepository, UpdatePostInput } from '../ports/PostRepository';
import { NotFoundError, ForbiddenError } from '../errors';

export class UpdatePost {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(id: string, userId: string, input: UpdatePostInput): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenError('Forbidden post access');
    }

    const updatedPost = await this.postRepository.update(id, input);
    if (!updatedPost) {
      throw new NotFoundError('Post not found');
    }

    return updatedPost;
  }
}
