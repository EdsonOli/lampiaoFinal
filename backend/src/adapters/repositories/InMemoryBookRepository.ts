
import { Book } from '../../core/domain/Book';
import { BookRepository, UpdateBookInput } from '../../core/ports/BookRepository';

// Dados mocados para simular um banco de dados
const books: Book[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'O Cortiço',
    isbn: '9788572326979',
    publishingCompany: 'Editora Martin Claret',
    writer: 'Aluisio Azevedo',
    genre: 'Romance',
    nPages: 320,
    yearPublication: 1890,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Memorias Postumas de Bras Cubas',
    isbn: '9788535910665',
    publishingCompany: 'Companhia das Letras',
    writer: 'Machado de Assis',
    genre: 'Romance',
    nPages: 256,
    yearPublication: 1881,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
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

  async findById(id: string): Promise<Book | null> {
    const book = books.find(b => b.id === id);
    return Promise.resolve(book || null);
  }

  async create(input: Omit<Book, 'id'>): Promise<Book> {
    const id = crypto.randomUUID();
    const newBook: Book = { id, ...input };
    books.push(newBook);
    return Promise.resolve(newBook);
  }

  async update(id: string, input: UpdateBookInput): Promise<Book | null> {
    const index = books.findIndex(b => b.id === id);
    if (index === -1) {
      return Promise.resolve(null);
    }

    books[index] = {
      ...books[index],
      ...input,
    };

    return Promise.resolve(books[index]);
  }
}
