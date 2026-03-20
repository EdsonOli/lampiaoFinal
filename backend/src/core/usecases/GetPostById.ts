import { Post } from '../domain/Post';
import { PostRepository } from '../ports/PostRepository';

export class GetPostById {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(id: string): Promise<Post | null> {
    return this.postRepository.findById(id);
  }
}
