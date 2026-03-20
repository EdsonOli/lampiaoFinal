import { PostRepository } from '../ports/PostRepository';

export class DeletePost {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(id: number, userId: number): Promise<void> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.userId !== userId) {
      throw new Error('Forbidden post access');
    }

    await this.postRepository.delete(id);
  }
}
