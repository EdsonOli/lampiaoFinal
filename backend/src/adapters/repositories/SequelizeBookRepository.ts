
import { Book } from '../../core/domain/Book';
import { BookRepository } from '../../core/ports/BookRepository';
import { Book as BookModel } from '../models/BookModel';

export class SequelizeBookRepository implements BookRepository {
  async findAll(): Promise<Book[]> {
    const books = await BookModel.findAll();
    return books.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
    }));
  }

  async findById(id: string): Promise<Book | null> {
    const book = await BookModel.findByPk(id);
    if (book) {
      return {
        id: book.id,
        title: book.title,
        author: book.author,
      };
    }
    return null;
  }
}
