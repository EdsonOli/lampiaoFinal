import { BookSeries, BookSeriesEntry } from '../../core/domain/BookSeries';
import { AddBookToSeriesInput, BookSeriesRepository, CreateSeriesInput } from '../../core/ports/BookSeriesRepository';
import { fn, col } from 'sequelize';
import { BookSeries as BookSeriesModel } from '../models/BookSeriesModel';
import { BookSeriesEntry as BookSeriesEntryModel } from '../models/BookSeriesEntryModel';
import { Book } from '../models/BookModel';

export class SequelizeBookSeriesRepository implements BookSeriesRepository {
  async findOrCreate(input: CreateSeriesInput): Promise<BookSeries> {
    // Procura por série existente
    const existing = await BookSeriesModel.findOne({
      where: { name: input.name },
    });

    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        universeName: existing.universeName ?? undefined,
        metadataSource: existing.metadataSource ?? undefined,
        metadataConfidence: existing.metadataConfidence,
      };
    }

    // Cria nova série
    const created = await BookSeriesModel.create({
      name: input.name,
      universeName: input.universeName ?? null,
      metadataSource: input.metadataSource ?? null,
      metadataConfidence: input.metadataConfidence,
    });

    return {
      id: created.id,
      name: created.name,
      universeName: created.universeName ?? undefined,
      metadataSource: created.metadataSource ?? undefined,
      metadataConfidence: created.metadataConfidence,
    };
  }

  async findById(id: string): Promise<BookSeries | null> {
    const series = await BookSeriesModel.findByPk(id);
    if (!series) {
      return null;
    }

    return {
      id: series.id,
      name: series.name,
      universeName: series.universeName ?? undefined,
      metadataSource: series.metadataSource ?? undefined,
      metadataConfidence: series.metadataConfidence,
    };
  }

  async findByName(name: string): Promise<BookSeries | null> {
    const series = await BookSeriesModel.findOne({
      where: { name },
    });

    if (!series) {
      return null;
    }

    return {
      id: series.id,
      name: series.name,
      universeName: series.universeName ?? undefined,
      metadataSource: series.metadataSource ?? undefined,
      metadataConfidence: series.metadataConfidence,
    };
  }

  async addBookToSeries(input: AddBookToSeriesInput): Promise<BookSeriesEntry> {
    // Tenta encontrar entrada existente
    const existing = await BookSeriesEntryModel.findOne({
      where: {
        bookId: input.bookId,
        seriesId: input.seriesId,
      },
    });

    if (existing) {
      return {
        id: existing.id,
        bookId: existing.bookId,
        seriesId: existing.seriesId,
        positionInSeries: existing.positionInSeries ?? undefined,
        positionLabel: existing.positionLabel ?? undefined,
      };
    }

    // Cria nova entrada
    const created = await BookSeriesEntryModel.create({
      bookId: input.bookId,
      seriesId: input.seriesId,
      positionInSeries: input.positionInSeries ?? null,
      positionLabel: input.positionLabel ?? null,
    });

    return {
      id: created.id,
      bookId: created.bookId,
      seriesId: created.seriesId,
      positionInSeries: created.positionInSeries ?? undefined,
      positionLabel: created.positionLabel ?? undefined,
    };
  }

  async findSeriesEntry(bookId: string, seriesId: string): Promise<BookSeriesEntry | null> {
    const entry = await BookSeriesEntryModel.findOne({
      where: { bookId, seriesId },
    });

    if (!entry) {
      return null;
    }

    return {
      id: entry.id,
      bookId: entry.bookId,
      seriesId: entry.seriesId,
      positionInSeries: entry.positionInSeries ?? undefined,
      positionLabel: entry.positionLabel ?? undefined,
    };
  }

  async findSeriesForBook(
    bookId: string
  ): Promise<(BookSeries & { positionInSeries?: number; positionLabel?: string })[]> {
    const entries = await BookSeriesEntryModel.findAll({
      where: { bookId },
      include: [{ model: BookSeriesModel, as: 'series' }],
    });

    return entries
      .filter((entry) => entry.get('series'))
      .map((entry) => {
        const series = entry.get('series') as any;
        return {
          id: series.id,
          name: series.name,
          universeName: series.universeName ?? undefined,
          metadataSource: series.metadataSource ?? undefined,
          metadataConfidence: series.metadataConfidence,
          positionInSeries: entry.positionInSeries ?? undefined,
          positionLabel: entry.positionLabel ?? undefined,
        };
      });
  }

  async findBooksInSeries(
    seriesId: string
  ): Promise<
    Array<{
      id: string;
      name: string;
      isbn: string;
      positionInSeries?: number;
      positionLabel?: string;
    }>
  > {
    const entries = await BookSeriesEntryModel.findAll({
      where: { seriesId },
      include: [{ model: Book, as: 'book' }],
      order: [['positionInSeries', 'ASC NULLS LAST']],
    });

    return entries
      .filter((entry) => entry.get('book'))
      .map((entry) => {
        const book = entry.get('book') as any;
        return {
          id: book.id,
          name: book.name,
          isbn: book.isbn,
          positionInSeries: entry.positionInSeries ?? undefined,
          positionLabel: entry.positionLabel ?? undefined,
        };
      });
  }

  async findAll(): Promise<BookSeries[]> {
    const series = await BookSeriesModel.findAll({
      order: [['name', 'ASC']],
    });

    return series.map((s) => ({
      id: s.id,
      name: s.name,
      universeName: s.universeName ?? undefined,
      metadataSource: s.metadataSource ?? undefined,
      metadataConfidence: s.metadataConfidence,
    }));
  }

  async findAllWithBookCount(): Promise<Array<BookSeries & { bookCount: number }>> {
    const series = await BookSeriesModel.findAll({
      include: [
        {
          model: BookSeriesEntryModel,
          as: 'entries',
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        'id',
        'name',
        'universeName',
        'metadataSource',
        'metadataConfidence',
        [fn('COUNT', col('entries.id')), 'bookCount'],
      ],
      group: ['BookSeries.id'],
      order: [['name', 'ASC']],
    });

    return series.map((s) => ({
      id: s.id,
      name: s.name,
      universeName: s.universeName ?? undefined,
      metadataSource: s.metadataSource ?? undefined,
      metadataConfidence: s.metadataConfidence,
      bookCount: Number(s.get('bookCount') ?? 0),
    }));
  }
}

