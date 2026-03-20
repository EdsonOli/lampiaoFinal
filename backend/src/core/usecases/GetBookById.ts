
import { Book } from '../domain/Book';
import { BookRepository } from '../ports/BookRepository';

export class GetBookById {
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(id: number): Promise<Book | null> {
    return this.bookRepository.findById(id);
  }
}
