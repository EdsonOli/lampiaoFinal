import { BookSeries, BookSeriesEntry } from '../domain/BookSeries';

export interface CreateSeriesInput {
  name: string;
  universeName?: string;
  metadataSource?: string;
  metadataConfidence: 'low' | 'medium' | 'high';
}

export interface AddBookToSeriesInput {
  bookId: string;
  seriesId: string;
  positionInSeries?: number;
  positionLabel?: string;
}

export interface BookSeriesRepository {
  /**
   * Find or create a series by name
   * Returns existing series if found, creates new one otherwise
   */
  findOrCreate(input: CreateSeriesInput): Promise<BookSeries>;

  /**
   * Get series by ID
   */
  findById(id: string): Promise<BookSeries | null>;

  /**
   * Get series by name (exact match)
   */
  findByName(name: string): Promise<BookSeries | null>;

  /**
   * Add book to series
   * Ensures one book-series relationship
   */
  addBookToSeries(input: AddBookToSeriesInput): Promise<BookSeriesEntry>;

  /**
   * Get series entry for a book in a series
   */
  findSeriesEntry(bookId: string, seriesId: string): Promise<BookSeriesEntry | null>;

  /**
   * Get all series entries for a book
   */
  findSeriesForBook(bookId: string): Promise<(BookSeries & { positionInSeries?: number; positionLabel?: string })[]>;

  /**
   * Get all books in a series, ordered by position
   */
  findBooksInSeries(
    seriesId: string
  ): Promise<
    Array<{
      id: string;
      name: string;
      isbn: string;
      positionInSeries?: number;
      positionLabel?: string;
    }>
  >;

  /**
   * Get all series (for listing/discovery)
   */
  findAll(): Promise<BookSeries[]>;

  /**
   * Get all series with aggregated number of books
   */
  findAllWithBookCount(): Promise<Array<BookSeries & { bookCount: number }>>;
}
