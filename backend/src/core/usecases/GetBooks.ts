import { Book } from '../domain/Book';
import { BookRepository } from '../ports/BookRepository';

export class GetBooks {
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(): Promise<Book[]> {
    return this.bookRepository.findAll();
  }

  async getBookById(id: number): Promise<Book | null> {
    return this.bookRepository.findById(id);
  }
}
