
import { NextFunction, Request, Response, Router } from 'express';
import { Container } from '../container';
import { ValidationError } from '../../core/errors';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import { auditLog } from '../services/AuditLogger';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { sanitizeBookImageUrl, sanitizeOptionalPlainText, sanitizePlainText } from '../validation/sanitizers';
import { createBookSchema, updateBookSchema } from '../validation/schemas';
import { badRequest, conflict, notFound, validationError } from '../http/respondError';

const router = Router();

// Get use cases from container
const {
  createBook,
  updateBook,
  getBookById,
  listAllBooks,
} = Container.useCases;

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
      return badRequest(res, 'O identificador do livro informado e invalido.', 'BOOK_ID_INVALID');
    }

    const book = await getBookById.execute(id);
    if (book) {
      res.json(book);
    } else {
      notFound(res, 'O livro solicitado nao foi encontrado.', 'BOOK_NOT_FOUND');
    }
  } catch (error) {
    next(error);
  }
});

// Rota para cadastrar um novo livro (autenticado)
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
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
      return validationError(res, getValidationMessage(error), 'BOOK_CREATE_INVALID_PAYLOAD');
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      return conflict(res, 'Ja existe um livro cadastrado com este ISBN.', 'BOOK_ISBN_CONFLICT');
    }

    if (err.name === 'SequelizeValidationError') {
      return validationError(res, err.message || 'Os dados do livro sao invalidos.', 'BOOK_CREATE_INVALID_DATA');
    }

    if (error instanceof ValidationError) {
      return validationError(res, error.message, 'BOOK_CREATE_INVALID_DATA');
    }

    next(error);
  }
});

router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return badRequest(res, 'O identificador do livro informado e invalido.', 'BOOK_ID_INVALID');
    }

    const payload = parseOrThrow(updateBookSchema, req.body);

    const normalizeGenre = (value: unknown): string | undefined => {
      if (Array.isArray(value)) {
        const genres = value
          .filter((entry): entry is string => typeof entry === 'string')
          .map(entry => entry.trim())
          .filter(Boolean);
        const merged = [...new Set(genres)].join(', ');
        return merged || undefined;
      }

      if (typeof value === 'string') {
        const merged = value
          .split(',')
          .map(entry => entry.trim())
          .filter(Boolean)
          .filter((entry, index, list) => list.indexOf(entry) === index)
          .join(', ');
        return merged || undefined;
      }

      return undefined;
    };

    const updatedBook = await updateBook.execute(id, {
      name: sanitizeOptionalPlainText(payload.name),
      isbn: sanitizeOptionalPlainText(payload.isbn),
      publishingCompany: sanitizeOptionalPlainText(payload.publishingCompany),
      writer: sanitizeOptionalPlainText(payload.writer),
      genre: normalizeGenre(payload.genre),
      nPages: payload.nPages,
      yearPublication: payload.yearPublication,
      img: sanitizeBookImageUrl(payload.img),
      synopsis: sanitizeOptionalPlainText(payload.synopsis),
    });

    await auditLog('book.update', {
      bookId: updatedBook.id,
      updatedFields: Object.keys(payload),
    });

    res.json(updatedBook);
  } catch (error) {
    const err = error as { name?: string; message?: string };

    if (isValidationError(error)) {
      return validationError(res, getValidationMessage(error), 'BOOK_UPDATE_INVALID_PAYLOAD');
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      return conflict(res, 'Ja existe um livro cadastrado com este ISBN.', 'BOOK_ISBN_CONFLICT');
    }

    if (err.name === 'SequelizeValidationError') {
      return validationError(res, err.message || 'Os dados do livro sao invalidos.', 'BOOK_UPDATE_INVALID_DATA');
    }

    if (error instanceof ValidationError) {
      return validationError(res, error.message, 'BOOK_UPDATE_INVALID_DATA');
    }

    next(error);
  }
});

export default router;
