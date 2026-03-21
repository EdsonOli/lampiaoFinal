import { Post } from '../domain/Post';
import { PostRepository } from '../ports/PostRepository';

export class GetPostsByIds {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(ids: string[]): Promise<Post[]> {
    if (!ids.length) {
      return [];
    }

    return this.postRepository.findByIds(ids);
  }
}
