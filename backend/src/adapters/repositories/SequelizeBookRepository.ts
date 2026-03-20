
import { Book } from '../../core/domain/Book';
import { BookRepository } from '../../core/ports/BookRepository';
import { Book as BookModel } from '../models/BookModel';

export class SequelizeBookRepository implements BookRepository {
  async findAll(): Promise<Book[]> {
    const books = await BookModel.findAll();
    return books.map(book => ({
      id: book.id,
      name: book.name,
      isbn: book.isbn,
      publishingCompany: book.publishing_company,
      writer: book.writer,
      genre: book.genre,
      nPages: book.n_pages,
      yearPublication: book.year_publication,
      img: book.img,
      synopsis: book.synopsis,
    }));
  }

  async findById(id: number): Promise<Book | null> {
    const book = await BookModel.findByPk(id);
    if (book) {
      return {
        id: book.id,
        name: book.name,
        isbn: book.isbn,
        publishingCompany: book.publishing_company,
        writer: book.writer,
        genre: book.genre,
        nPages: book.n_pages,
        yearPublication: book.year_publication,
        img: book.img,
        synopsis: book.synopsis,
      };
    }
    return null;
  }

  async create(input: Omit<Book, 'id'>): Promise<Book> {
    const book = await BookModel.create({
      name: input.name,
      isbn: input.isbn,
      publishing_company: input.publishingCompany,
      writer: input.writer,
      genre: input.genre,
      n_pages: input.nPages,
      year_publication: input.yearPublication,
      img: input.img ?? null,
      synopsis: input.synopsis ?? null,
    });
    return {
      id: book.id,
      name: book.name,
      isbn: book.isbn,
      publishingCompany: book.publishing_company,
      writer: book.writer,
      genre: book.genre,
      nPages: book.n_pages,
      yearPublication: book.year_publication,
      img: book.img,
      synopsis: book.synopsis,
    };
  }
}
