import { Book } from '../domain/Book';

export interface BookRepository {
  findAll(): Promise<Book[]>;
  findById(id: string): Promise<Book | null>;
  create(input: Omit<Book, 'id'>): Promise<Book>;
}
