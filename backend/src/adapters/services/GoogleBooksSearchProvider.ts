import { ExternalBookSearchResult, ExternalBookSeriesMetadata } from '../../core/domain/ExternalBookSearchResult';
import { ExternalBookSearchProvider, ExternalBookSearchQuery } from '../../core/ports/ExternalBookSearchProvider';
import { appLogger, serializeError } from './AppLogger';

interface GoogleBookVolumeInfo {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: Array<{ type: string; identifier: string }>;
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  categories?: string[];
  language?: string;
}

interface GoogleBookItem {
  id: string;
  volumeInfo?: GoogleBookVolumeInfo;
}

export class GoogleBooksSearchProvider implements ExternalBookSearchProvider {
  readonly source = 'google-books';

  async search(input: ExternalBookSearchQuery): Promise<ExternalBookSearchResult[]> {
    try {
      const url = new URL('https://www.googleapis.com/books/v1/volumes');
      url.searchParams.set('q', input.query);
      url.searchParams.set('startIndex', String(input.startIndex));
      url.searchParams.set('maxResults', String(input.maxResults));
      url.searchParams.set('printType', 'books');
      url.searchParams.set('orderBy', 'relevance');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Lampiao-API/1.0 (https://lampiao.app)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        appLogger.warn('external_search.google_books.unavailable', 'Google Books API returned a non-success status', {
          provider: this.source,
          query: input.query,
          statusCode: response.status,
        });
        return [];
      }

      const data = (await response.json()) as { items?: GoogleBookItem[] };
      return (data.items || []).map((item) => this.mapItem(item)).filter((item): item is ExternalBookSearchResult => item !== null);
    } catch (error) {
      appLogger.error('external_search.google_books.failed', 'Google Books search request failed', {
        provider: this.source,
        query: input.query,
        error: serializeError(error),
      });
      return [];
    }
  }

  private mapItem(item: GoogleBookItem): ExternalBookSearchResult | null {
    const info = item.volumeInfo;
    const title = info?.title?.trim();
    if (!title) {
      return null;
    }

    const subtitle = info?.subtitle?.trim() || undefined;
    const publishedYear = info?.publishedDate ? Number.parseInt(info.publishedDate.slice(0, 4), 10) : undefined;
    const coverUrl = info?.imageLinks
      ? (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || '').replace(/^http:\/\//, 'https://')
      : undefined;

    return {
      externalId: item.id,
      title,
      subtitle,
      authors: info?.authors || [],
      publisher: info?.publisher || undefined,
      publishedYear: Number.isFinite(publishedYear) ? publishedYear : undefined,
      description: info?.description || undefined,
      isbns: (info?.industryIdentifiers || []).map((identifier) => identifier.identifier).filter(Boolean),
      coverUrl,
      categories: info?.categories || [],
      language: info?.language || undefined,
      source: this.source,
      series: this.inferSeries(info),
    };
  }

  private inferSeries(info?: GoogleBookVolumeInfo): ExternalBookSeriesMetadata | undefined {
    const subtitle = info?.subtitle?.trim();
    if (!subtitle) {
      return undefined;
    }

    // Padrões comuns em Google Books:
    // "Book 1" / "Book 1: Series Name"
    // "Vol. 1 of Series Name"
    // etc

    // Pattern: "Book X: Series Name" ou "Book X - Series Name"
    const bookMatch = subtitle.match(/book\s+([a-z]+|\d+)(?:\s*[-:]\s*)?(.+)?/i);
    if (bookMatch) {
      const [, posLabel, maybeSeriesName] = bookMatch;
      const posNum = this.parsePositionLabel(posLabel);
      return {
        name: maybeSeriesName ? maybeSeriesName.trim() : subtitle,
        positionInSeries: posNum,
        positionLabel: posLabel,
        metadataSource: this.source,
        metadataConfidence: maybeSeriesName ? 'medium' : 'low',
      };
    }

    // Pattern: "Vol. X of Series" ou "Volume X: Series"
    const volMatch = subtitle.match(/vol(?:ume)?\.?\s+([a-z]+|\d+)(?:\s+of\s+)?(.+)?/i);
    if (volMatch) {
      const [, posLabel, maybeSeriesName] = volMatch;
      const posNum = this.parsePositionLabel(posLabel);
      return {
        name: maybeSeriesName ? maybeSeriesName.trim() : subtitle,
        positionInSeries: posNum,
        positionLabel: posLabel,
        metadataSource: this.source,
        metadataConfidence: maybeSeriesName ? 'medium' : 'low',
      };
    }

    // Se não conseguiu pattern específico, retorna com baixa confiança
    return {
      name: subtitle,
      metadataSource: this.source,
      metadataConfidence: 'low',
    };
  }

  private parsePositionLabel(label: string): number | undefined {
    // Converte "One" -> 1, "1" -> 1, "2" -> 2, etc
    const numberMatch = label.match(/\d+/);
    if (numberMatch) {
      return Number.parseInt(numberMatch[0], 10);
    }

    const words: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };

    return words[label.toLowerCase()] || undefined;
  }
}
