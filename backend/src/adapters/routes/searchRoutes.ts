import { NextFunction, Request, Response, Router } from 'express';
import { Container } from '../container';
import { authenticate } from '../middlewares/authenticate';
import { globalRateLimiter } from '../middlewares/rateLimiters';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { sanitizeBookImageUrl, sanitizeOptionalPlainText, sanitizePlainText } from '../validation/sanitizers';
import { createBookSchema } from '../validation/schemas';
import { badRequest, conflict, validationError } from '../http/respondError';
import { CreateBookSeriesMetadata } from '../../core/usecases/CreateBook';
import { ValidationError } from '../../core/errors';

const router = Router();
const { createBook, searchExternalBooks } = Container.useCases;

function getSingleQueryParam(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : fallback;
  return fallback;
}

function normalizeGenre(value: unknown): string {
  if (Array.isArray(value)) {
    const genres = value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean);
    return [...new Set(genres)].join(', ');
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .filter((entry, index, list) => list.indexOf(entry) === index)
      .join(', ');
  }

  return '';
}

type RawSeriesPayload = {
  name?: unknown;
  universeName?: unknown;
  positionInSeries?: unknown;
  positionLabel?: unknown;
  metadataSource?: unknown;
  metadataConfidence?: unknown;
};

type ImportRequestBody = Request['body'] & {
  series?: RawSeriesPayload;
};

function getOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function parseSeriesPayload(seriesData?: RawSeriesPayload): CreateBookSeriesMetadata | undefined {
  if (!seriesData || typeof seriesData !== 'object') {
    return undefined;
  }

  const name = getOptionalString(seriesData.name);
  if (!name) {
    return undefined;
  }

  return {
    name,
    universeName: getOptionalString(seriesData.universeName),
    positionInSeries: typeof seriesData.positionInSeries === 'number' ? seriesData.positionInSeries : undefined,
    positionLabel: getOptionalString(seriesData.positionLabel),
    metadataSource: getOptionalString(seriesData.metadataSource),
    metadataConfidence: seriesData.metadataConfidence === 'medium' || seriesData.metadataConfidence === 'high'
      ? seriesData.metadataConfidence
      : 'low',
  };
}

router.get('/', globalRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = getSingleQueryParam(req.query.q).trim();
    const startIndex = Math.max(0, Number.parseInt(getSingleQueryParam(req.query.startIndex, '0'), 10));
    const maxResults = Math.min(40, Math.max(1, Number.parseInt(getSingleQueryParam(req.query.maxResults, '20'), 10)));

    if (!query) {
      return badRequest(res, 'O parametro de busca "q" e obrigatorio.', 'SEARCH_QUERY_REQUIRED');
    }

    const results = await searchExternalBooks.execute({
      query,
      startIndex,
      maxResults,
    });

    res.json(results);
  } catch (error) {
    next(error);
  }
});

router.post('/import', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseOrThrow(createBookSchema, req.body);
    const rawPayload: ImportRequestBody = req.body;
    const series = parseSeriesPayload(rawPayload.series);

    const createdBook = await createBook.execute({
      name: sanitizePlainText(payload.name),
      isbn: sanitizePlainText(payload.isbn),
      publishingCompany: sanitizePlainText(payload.publishingCompany),
      writer: sanitizePlainText(payload.writer),
      genre: normalizeGenre(payload.genre),
      nPages: payload.nPages,
      yearPublication: payload.yearPublication,
      img: sanitizeBookImageUrl(payload.img),
      synopsis: sanitizeOptionalPlainText(payload.synopsis),
      series,
    });

    res.status(201).json(createdBook);
  } catch (error) {
    const err = error as { name?: string; message?: string };

    if (isValidationError(error)) {
      return validationError(res, getValidationMessage(error), 'SEARCH_IMPORT_INVALID_PAYLOAD');
    }

    if (error instanceof ValidationError) {
      return validationError(res, error.message, 'SEARCH_IMPORT_INVALID_DATA');
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      return conflict(res, 'Ja existe um livro cadastrado com este ISBN.', 'SEARCH_IMPORT_ISBN_CONFLICT');
    }

    if (err.name === 'SequelizeValidationError') {
      return validationError(res, err.message || 'Os dados do livro importado sao invalidos.', 'SEARCH_IMPORT_INVALID_DATA');
    }

    if (err.name === 'SequelizeDatabaseError' && /value too long|character varying/i.test(err.message || '')) {
      return validationError(res, 'Os dados do livro importado excedem o tamanho permitido.', 'SEARCH_IMPORT_INVALID_DATA');
    }

    next(error);
  }
});

export default router;
