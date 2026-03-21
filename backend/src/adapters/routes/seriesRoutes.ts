import { NextFunction, Request, Response, Router } from 'express';
import { Container } from '../container';
import { badRequest, notFound } from '../http/respondError';

const router = Router();
const { getSeriesWithBooks, listAllSeries, getBookSeries, listSeriesNarrativePosts } = Container.useCases;

function encodeCursor(cursor: { createdAt: Date; id: string }): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: cursor.createdAt.toISOString(),
      id: cursor.id,
    })
  ).toString('base64url');
}

function decodeCursor(cursor?: string): { createdAt: Date; id: string } | undefined {
  if (!cursor) {
    return undefined;
  }

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as { createdAt?: string; id?: string };
    if (!parsed.createdAt || !parsed.id) {
      return undefined;
    }

    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      return undefined;
    }

    return { createdAt, id: parsed.id };
  } catch {
    return undefined;
  }
}

function parseLimit(rawLimit: unknown, fallback = 20): number {
  const rawValue = Array.isArray(rawLimit) ? rawLimit[0] : rawLimit;
  const numeric = Number.parseInt(typeof rawValue === 'string' ? rawValue : String(fallback), 10);
  return Number.isFinite(numeric) ? numeric : fallback;
}

/**
 * GET /api/v1/series
 * Lista todas as séries com contagem de livros
 * Usado para hub de séries, descoberta
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const series = await listAllSeries.execute();
    res.json(series);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/series/by-book/:bookId
 * Retorna as séries associadas a um livro
 * Usado no detalhe do livro para contexto de saga/universo
 */
router.get('/by-book/:bookId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookId } = req.params;

    if (!bookId) {
      return badRequest(res, 'O identificador do livro informado e invalido.', 'SERIES_BOOK_ID_INVALID');
    }

    const series = await getBookSeries.execute(bookId);
    res.json(series);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/series/:seriesId/posts?limit=20
 * Retorna posts publicos da comunidade agregados pelos livros da série
 */
router.get('/:seriesId/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { seriesId } = req.params;
    const limit = parseLimit(req.query.limit, 20);

    const posts = await listSeriesNarrativePosts.execute(seriesId, limit);
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/series/:seriesId/posts/paginated?limit=20&cursor=...
 * Retorna posts com paginação por cursor (createdAt + id)
 */
router.get('/:seriesId/posts/paginated', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { seriesId } = req.params;
    const limit = parseLimit(req.query.limit, 20);
    const cursor = decodeCursor(typeof req.query.cursor === 'string' ? req.query.cursor : undefined);

    const page = await listSeriesNarrativePosts.executePage(seriesId, limit, cursor);

    return res.json({
      items: page.items,
      nextCursor: page.nextCursor ? encodeCursor(page.nextCursor) : null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/series/:seriesId
 * Retorna série com todos os livros em ordem
 * Página de detalhe de série (hub)
 */
router.get('/:seriesId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { seriesId } = req.params;

    const seriesWithBooks = await getSeriesWithBooks.execute(seriesId);
    if (!seriesWithBooks) {
      return notFound(res, 'A serie solicitada nao foi encontrada.', 'SERIES_NOT_FOUND');
    }

    res.json(seriesWithBooks);
  } catch (error) {
    next(error);
  }
});

export default router;
