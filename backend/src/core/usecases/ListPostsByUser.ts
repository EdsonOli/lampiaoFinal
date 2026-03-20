import { Post } from '../domain/Post';
import { PostRepository } from '../ports/PostRepository';

export class ListPostsByUser {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(userId: string): Promise<Post[]> {
    return this.postRepository.findByUserId(userId);
  }
}
