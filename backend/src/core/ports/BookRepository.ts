import { Book } from '../domain/Book';

export interface UpdateBookInput {
  name?: string;
  isbn?: string;
  publishingCompany?: string;
  writer?: string;
  genre?: string;
  nPages?: number;
  yearPublication?: number;
  img?: string;
  synopsis?: string;
}

export interface BookRepository {
  findAll(): Promise<Book[]>;
  findById(id: string): Promise<Book | null>;
  create(input: Omit<Book, 'id'>): Promise<Book>;
  update(id: string, input: UpdateBookInput): Promise<Book | null>;
}
