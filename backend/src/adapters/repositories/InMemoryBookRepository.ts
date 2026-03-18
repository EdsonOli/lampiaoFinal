
import { Book } from '../../core/domain/Book';
import { BookRepository } from '../../core/ports/BookRepository';

// Dados mocados para simular um banco de dados
const books: Book[] = [
  {
    id: '1',
    title: 'O Cortiço',
    author: 'Aluísio Azevedo',
  },
  {
    id: '2',
    title: 'Memórias Póstumas de Brás Cubas',
    author: 'Machado de Assis',
  },
  {
    id: '3',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
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
}
