import { BookSeries } from '../domain/BookSeries';

export interface SeriesWithBooksOutput {
  id: string;
  name: string;
  universeName?: string;
  metadataSource?: string;
  metadataConfidence: 'low' | 'medium' | 'high';
  books: Array<{
    id: string;
    name: string;
    isbn: string;
    writer: string;
    img?: string;
    positionInSeries?: number;
    positionLabel?: string;
  }>;
}

/**
 * Busca série com todos os livros em ordem
 * Retorna série e livros ordinais, ideal para hub de série
 */
export class GetSeriesWithBooks {
  constructor(private readonly bookSeriesRepository: any) {
    // Qualquer coisa que implemente findById + findBooksInSeries
  }

  async execute(seriesId: string): Promise<SeriesWithBooksOutput | null> {
    const series = await this.bookSeriesRepository.findById(seriesId);
    if (!series) {
      return null;
    }

    const books = await this.bookSeriesRepository.findBooksInSeries(seriesId);

    return {
      id: series.id,
      name: series.name,
      universeName: series.universeName,
      metadataSource: series.metadataSource,
      metadataConfidence: series.metadataConfidence,
      books,
    };
  }
}
