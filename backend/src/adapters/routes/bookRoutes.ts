
import { NextFunction, Request, Response, Router } from 'express';
import { ListAllBooks } from '../../core/usecases/ListAllBooks';
import { GetBookById } from '../../core/usecases/GetBookById';
import { CreateBook } from '../../core/usecases/CreateBook';
import { InMemoryBookRepository } from '../repositories/InMemoryBookRepository';
import { SequelizeBookRepository } from '../repositories/SequelizeBookRepository';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

// --- Instanciando dependências ---
const bookRepository = process.env.BOOK_REPOSITORY === 'memory'
  ? new InMemoryBookRepository()
  : new SequelizeBookRepository();
const listAllBooks = new ListAllBooks(bookRepository);
const getBookById = new GetBookById(bookRepository);
const createBook = new CreateBook(bookRepository);

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

// Rota para cadastrar um novo livro (autenticado)
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, isbn, publishingCompany, writer, genre, nPages, yearPublication, img, synopsis } = req.body;
    const nPagesNum = Number(nPages);
    const yearPublicationNum = Number(yearPublication);

    const normalizeOptional = (value: unknown, maxLength = 255): string | undefined => {
      if (typeof value !== 'string') return undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
    };

    const normalizeGenre = (value: unknown): string => {
      if (Array.isArray(value)) {
        const genres = value
          .filter((entry): entry is string => typeof entry === 'string')
          .map(entry => entry.trim())
          .filter(Boolean);
        return [...new Set(genres)].join(', ');
      }

      if (typeof value === 'string') {
        return value
          .split(',')
          .map(entry => entry.trim())
          .filter(Boolean)
          .filter((entry, index, list) => list.indexOf(entry) === index)
          .join(', ');
      }

      return '';
    };

    const normalizedGenre = normalizeGenre(genre);

    if (!name || !writer || !normalizedGenre || !nPages || !yearPublication || !isbn || !publishingCompany) {
      return res.status(400).json({ message: 'Missing required fields: name, writer, genre, nPages, yearPublication, isbn, publishingCompany' });
    }

    if (!Number.isFinite(nPagesNum) || nPagesNum <= 0) {
      return res.status(400).json({ message: 'nPages must be a positive number' });
    }

    if (!Number.isFinite(yearPublicationNum) || yearPublicationNum <= 0) {
      return res.status(400).json({ message: 'yearPublication must be a positive number' });
    }

    const book = await createBook.execute({
      name,
      isbn,
      publishingCompany,
      writer,
      genre: normalizedGenre,
      nPages: nPagesNum,
      yearPublication: yearPublicationNum,
      // Current DB schema uses VARCHAR for optional fields; truncate to prevent SQL errors.
      img: normalizeOptional(img),
      synopsis: normalizeOptional(synopsis),
    });

    res.status(201).json(book);
  } catch (error) {
    const err = error as { name?: string; message?: string };

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'ISBN already exists' });
    }

    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: err.message || 'Invalid book payload' });
    }

    next(error);
  }
});

export default router;
