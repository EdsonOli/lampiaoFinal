import { PostRepository } from '../ports/PostRepository';
import { NotFoundError, ForbiddenError } from '../errors';

export class DeletePost {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenError('Forbidden post access');
    }

    await this.postRepository.delete(id);
  }
}
