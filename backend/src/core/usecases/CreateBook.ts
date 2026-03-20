import { Book } from '../domain/Book';
import { BookRepository } from '../ports/BookRepository';

export type CreateBookInput = Omit<Book, 'id'>;

export class CreateBook {
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(input: CreateBookInput): Promise<Book> {
    return this.bookRepository.create(input);
  }
}
