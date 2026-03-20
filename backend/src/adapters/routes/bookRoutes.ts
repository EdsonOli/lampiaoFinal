
import { NextFunction, Request, Response, Router } from 'express';
import { Container } from '../container';
import { authenticate } from '../middlewares/authenticate';
import { auditLog } from '../services/AuditLogger';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { sanitizeBookImageUrl, sanitizeOptionalPlainText, sanitizePlainText } from '../validation/sanitizers';
import { createBookSchema } from '../validation/schemas';

const router = Router();

// Get use cases and repositories from container
const {
  createBook,
  getBookById,
  listAllBooks,
} = Container.useCases;
const { book: bookRepository } = Container.repositories;

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
    const id = String(req.params.id);
    if (!id) {
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
    const payload = parseOrThrow(createBookSchema, req.body);

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

    const normalizedGenre = normalizeGenre(payload.genre);

    const book = await createBook.execute({
      name: sanitizePlainText(payload.name),
      isbn: sanitizePlainText(payload.isbn),
      publishingCompany: sanitizePlainText(payload.publishingCompany),
      writer: sanitizePlainText(payload.writer),
      genre: normalizedGenre,
      nPages: payload.nPages,
      yearPublication: payload.yearPublication,
      img: sanitizeBookImageUrl(payload.img),
      synopsis: sanitizeOptionalPlainText(payload.synopsis),
    });

    await auditLog('book.create', { bookId: book.id, isbn: book.isbn });

    res.status(201).json(book);
  } catch (error) {
    const err = error as { name?: string; message?: string };

    if (isValidationError(error)) {
      return res.status(400).json({ message: getValidationMessage(error) });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'ISBN already exists' });
    }

    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: err.message || 'Invalid book payload' });
    }

    if (err.message === 'Invalid image URL') {
      return res.status(400).json({ message: 'Invalid image URL' });
    }

    next(error);
  }
});

export default router;
