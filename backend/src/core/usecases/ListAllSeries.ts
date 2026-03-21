import { BookSeriesRepository } from '../ports/BookSeriesRepository';

/**
 * Retorna todas as séries com contagem de livros
 * Útil para hub de séries, descoberta
 */
export class ListAllSeries {
  constructor(private readonly bookSeriesRepository: BookSeriesRepository) {}

  async execute(): Promise<
    Array<{
      id: string;
      name: string;
      universeName?: string;
      bookCount: number;
    }>
  > {
    const allSeries = await this.bookSeriesRepository.findAllWithBookCount();
    return allSeries.map(series => ({
      id: series.id,
      name: series.name,
      universeName: series.universeName,
      bookCount: series.bookCount,
    }));
  }
}
