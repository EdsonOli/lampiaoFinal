import { Book } from '../domain/Book';
import { BookRepository } from '../ports/BookRepository';
import { BookSeriesRepository } from '../ports/BookSeriesRepository';

export type CreateBookInput = Omit<Book, 'id'>;

export interface CreateBookSeriesMetadata {
  name: string;
  universeName?: string;
  positionInSeries?: number;
  positionLabel?: string;
  metadataSource?: string;
  metadataConfidence?: 'low' | 'medium' | 'high';
}

export interface CreateBookWithSeriesInput extends CreateBookInput {
  series?: CreateBookSeriesMetadata;
}

/**
 * CreateBook use case
 * Creates a book and optionally associates it with a series
 */
export class CreateBook {
  constructor(
    private readonly bookRepository: BookRepository,
    private readonly bookSeriesRepository?: BookSeriesRepository
  ) {}

  async execute(input: CreateBookWithSeriesInput): Promise<Book> {
    const book = await this.bookRepository.create(input);

    // Se houver série e repositório disponível, persiste a relação
    if (input.series && this.bookSeriesRepository) {
      const series = await this.bookSeriesRepository.findOrCreate({
        name: input.series.name,
        universeName: input.series.universeName,
        metadataSource: input.series.metadataSource,
        metadataConfidence: input.series.metadataConfidence || 'low',
      });

      await this.bookSeriesRepository.addBookToSeries({
        bookId: book.id,
        seriesId: series.id,
        positionInSeries: input.series.positionInSeries,
        positionLabel: input.series.positionLabel,
      });
    }

    return book;
  }
}

