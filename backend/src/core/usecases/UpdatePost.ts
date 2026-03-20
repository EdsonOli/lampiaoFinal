import { Post } from '../domain/Post';
import { PostRepository, UpdatePostInput } from '../ports/PostRepository';

export class UpdatePost {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(id: number, userId: number, input: UpdatePostInput): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.userId !== userId) {
      throw new Error('Forbidden post access');
    }

    const updatedPost = await this.postRepository.update(id, input);
    if (!updatedPost) {
      throw new Error('Post not found');
    }

    return updatedPost;
  }
}
