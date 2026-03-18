
import { Router, Request, Response } from 'express';
import { GetAllBooks } from '../../core/usecases/GetAllBooks';
import { GetBookById } from '../../core/usecases/GetBookById';
import { SequelizeBookRepository } from '../repositories/SequelizeBookRepository';

const router = Router();

// --- Instanciando dependências ---
const bookRepository = new SequelizeBookRepository();
const getAllBooks = new GetAllBooks(bookRepository);
const getBookById = new GetBookById(bookRepository);

// --- Definindo as rotas da API ---

// Rota para listar todos os livros
router.get('/', async (req: Request, res: Response) => {
  try {
    const books = await getAllBooks.execute();
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books' });
  }
});

// Rota para buscar um livro por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const book = await getBookById.execute(id);
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching book' });
  }
});

export default router;
