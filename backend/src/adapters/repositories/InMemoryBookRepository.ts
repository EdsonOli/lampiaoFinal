
import { Book } from '../../core/domain/Book';
import { BookRepository } from '../../core/ports/BookRepository';

// Dados mocados para simular um banco de dados
const books: Book[] = [
  {
    id: 1,
    name: 'O Cortiço',
    isbn: '9788572326979',
    publishingCompany: 'Editora Martin Claret',
    writer: 'Aluisio Azevedo',
    genre: 'Romance',
    nPages: 320,
    yearPublication: 1890,
  },
  {
    id: 2,
    name: 'Memorias Postumas de Bras Cubas',
    isbn: '9788535910665',
    publishingCompany: 'Companhia das Letras',
    writer: 'Machado de Assis',
    genre: 'Romance',
    nPages: 256,
    yearPublication: 1881,
  },
  {
    id: 3,
    name: 'Dom Casmurro',
    isbn: '9788535902776',
    publishingCompany: 'Companhia das Letras',
    writer: 'Machado de Assis',
    genre: 'Romance',
    nPages: 288,
    yearPublication: 1899,
  },
];

export class InMemoryBookRepository implements BookRepository {
  async findAll(): Promise<Book[]> {
    // Simula uma chamada assíncrona ao banco de dados
    return Promise.resolve(books);
  }

  async findById(id: number): Promise<Book | null> {
    const book = books.find(b => b.id === id);
    return Promise.resolve(book || null);
  }

  async create(input: Omit<Book, 'id'>): Promise<Book> {
    const id = books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;
    const newBook: Book = { id, ...input };
    books.push(newBook);
    return Promise.resolve(newBook);
  }
}
