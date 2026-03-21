import { BookSeriesRepository } from '../ports/BookSeriesRepository';
import { PostCursor, PostRepository } from '../ports/PostRepository';

export interface SeriesNarrativePost {
  id: string;
  title: string;
  text: string;
  isItPublic: boolean;
  userId: string;
  bookId: string;
  createdAt?: Date;
  bookName: string;
  positionInSeries?: number;
  positionLabel?: string;
}

export interface SeriesNarrativePage {
  items: SeriesNarrativePost[];
  nextCursor?: PostCursor;
}

export class ListSeriesNarrativePosts {
  constructor(
    private readonly bookSeriesRepository: BookSeriesRepository,
    private readonly postRepository: PostRepository,
  ) {}

  async execute(seriesId: string, limit = 20): Promise<SeriesNarrativePost[]> {
    const page = await this.executePage(seriesId, limit);
    return page.items;
  }

  async executePage(seriesId: string, limit = 20, cursor?: PostCursor): Promise<SeriesNarrativePage> {
    if (!seriesId) {
      return { items: [] };
    }

    const books = await this.bookSeriesRepository.findBooksInSeries(seriesId);
    if (!books.length) {
      return { items: [] };
    }

    const boundedLimit = Math.max(1, Math.min(100, limit));
    const posts = await this.postRepository.findPublicByBookIds(
      books.map(book => book.id),
      {
        limit: boundedLimit + 1,
        cursor,
      }
    );

    const bookById = new Map(books.map(book => [book.id, book]));

    const merged: SeriesNarrativePost[] = [];

    posts.forEach(post => {
      const book = bookById.get(post.bookId);
      if (!book) {
        return;
      }

      const entry: SeriesNarrativePost = {
        ...post,
        bookName: book.name,
      };

      if (book.positionInSeries !== undefined) {
        entry.positionInSeries = book.positionInSeries;
      }

      if (book.positionLabel !== undefined) {
        entry.positionLabel = book.positionLabel;
      }

      merged.push(entry);
    });

    merged.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (bTime !== aTime) {
          return bTime - aTime;
        }
        return b.id.localeCompare(a.id);
      });

    const hasMore = merged.length > boundedLimit;
    const items = hasMore ? merged.slice(0, boundedLimit) : merged;
    const last = items.at(-1);

    const nextCursor = hasMore && last?.createdAt
      ? {
          createdAt: new Date(last.createdAt),
          id: last.id,
        }
      : undefined;

    return {
      items,
      nextCursor,
    };
  }
}
