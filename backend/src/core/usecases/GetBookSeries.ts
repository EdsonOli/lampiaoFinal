import { BookSeriesRepository } from '../ports/BookSeriesRepository';

export class GetBookSeries {
  constructor(private readonly bookSeriesRepository: BookSeriesRepository) {}

  async execute(bookId: string) {
    if (!bookId) {
      return [];
    }

    return this.bookSeriesRepository.findSeriesForBook(bookId);
  }
}
