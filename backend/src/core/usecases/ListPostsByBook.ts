import { Post } from '../domain/Post';
import { PostRepository } from '../ports/PostRepository';

export class ListPostsByBook {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(bookId: number): Promise<Post[]> {
    return this.postRepository.findByBookId(bookId);
  }
}
