import { Post } from '../domain/Post';
import { BookRepository } from '../ports/BookRepository';
import { CreatePostInput, PostRepository } from '../ports/PostRepository';
import { NotFoundError } from '../errors';

export class CreatePost {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly bookRepository: BookRepository
  ) {}

  async execute(input: CreatePostInput): Promise<Post> {
    const book = await this.bookRepository.findById(input.bookId);
    if (!book) {
      throw new NotFoundError('Book not found');
    }

    return this.postRepository.create(input);
  }
}
