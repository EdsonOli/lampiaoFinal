
import { NextFunction, Request, Response, Router } from 'express';
import { ListAllBooks } from '../../core/usecases/ListAllBooks';
import { GetBookById } from '../../core/usecases/GetBookById';
import { InMemoryBookRepository } from '../repositories/InMemoryBookRepository';
import { SequelizeBookRepository } from '../repositories/SequelizeBookRepository';

const router = Router();

// --- Instanciando dependências ---
const bookRepository = process.env.BOOK_REPOSITORY === 'memory'
  ? new InMemoryBookRepository()
  : new SequelizeBookRepository();
const listAllBooks = new ListAllBooks(bookRepository);
const getBookById = new GetBookById(bookRepository);

// --- Definindo as rotas da API ---

// Rota para listar todos os livros
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await listAllBooks.execute();
    res.json(books);
  } catch (error) {
    next(error);
  }
});

// Rota para buscar um livro por ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid book id' });
    }

    const book = await getBookById.execute(id);
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
