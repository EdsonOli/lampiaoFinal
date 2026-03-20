import { Post } from '../domain/Post';
import { PostRepository } from '../ports/PostRepository';

export class ListAllPosts {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(): Promise<Post[]> {
    return this.postRepository.findAll();
  }
}
