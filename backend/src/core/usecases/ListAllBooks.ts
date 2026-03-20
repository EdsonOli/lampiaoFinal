import { Book } from '../domain/Book';
import { BookRepository } from '../ports/BookRepository';

export class ListAllBooks {
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(): Promise<Book[]> {
    return this.bookRepository.findAll();
  }
}
