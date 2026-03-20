import { Book } from '../domain/Book';
import { NotFoundError } from '../errors';
import { BookRepository, UpdateBookInput } from '../ports/BookRepository';

export class UpdateBook {
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(id: string, input: UpdateBookInput): Promise<Book> {
    const book = await this.bookRepository.update(id, input);

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    return book;
  }
}
