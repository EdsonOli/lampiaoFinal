import { ExternalBookSearchResult, ExternalBookSeriesMetadata } from '../../core/domain/ExternalBookSearchResult';
import { ExternalBookSearchProvider, ExternalBookSearchQuery } from '../../core/ports/ExternalBookSearchProvider';
import { appLogger, serializeError } from './AppLogger';

interface OpenLibraryDoc {
  key?: string;
  title?: string;
  subtitle?: string;
  author_name?: string[];
  publisher?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  subject?: string[];
  language?: string[];
  series?: string[];
  number_in_series?: number;
}

export class OpenLibrarySearchProvider implements ExternalBookSearchProvider {
  readonly source = 'open-library';

  async search(input: ExternalBookSearchQuery): Promise<ExternalBookSearchResult[]> {
    try {
      const url = new URL('https://openlibrary.org/search.json');
      url.searchParams.set('q', input.query);
      url.searchParams.set('limit', String(input.maxResults));
      url.searchParams.set('offset', String(input.startIndex));

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
        appLogger.warn('external_search.open_library.unavailable', 'OpenLibrary API returned a non-success status', {
          provider: this.source,
          query: input.query,
          statusCode: response.status,
        });
        return [];
      }

      const data = (await response.json()) as { docs?: OpenLibraryDoc[] };
      return (data.docs || []).map((doc) => this.mapDoc(doc)).filter((item): item is ExternalBookSearchResult => item !== null);
    } catch (error) {
      appLogger.error('external_search.open_library.failed', 'OpenLibrary search request failed', {
        provider: this.source,
        query: input.query,
        error: serializeError(error),
      });
      return [];
    }
  }

  private mapDoc(doc: OpenLibraryDoc): ExternalBookSearchResult | null {
    const title = doc.title?.trim();
    if (!title) {
      return null;
    }

    return {
      externalId: doc.key || title,
      title,
      subtitle: doc.subtitle?.trim() || undefined,
      authors: doc.author_name || [],
      publisher: doc.publisher?.[0] || undefined,
      publishedYear: doc.first_publish_year,
      description: undefined,
      isbns: doc.isbn || [],
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
      categories: doc.subject || [],
      language: doc.language?.[0] || undefined,
      source: this.source,
      series: this.mapSeries(doc),
    };
  }

  private mapSeries(doc: OpenLibraryDoc): ExternalBookSeriesMetadata | undefined {
    // Primeira tentativa: usar campo series se existir
    const structuredSeries = doc.series?.[0]?.trim();
    if (structuredSeries) {
      return {
        name: structuredSeries,
        positionInSeries: typeof doc.number_in_series === 'number' ? doc.number_in_series : undefined,
        positionLabel: typeof doc.number_in_series === 'number' ? `Livro ${doc.number_in_series}` : undefined,
        metadataSource: this.source,
        metadataConfidence: doc.number_in_series ? 'high' : 'medium',
      };
    }

    // Segunda tentativa: extrair série do subtitle
    const subtitle = doc.subtitle?.trim();
    if (!subtitle) {
      return undefined;
    }

    // Padrões comuns:
    // "Book One of the Wheel of Time" -> série = "The Wheel of Time", pos = 1
    // "(The Wheel of Time, Book 6)" -> série = "The Wheel of Time", pos = 6
    // "Vol. 1" -> ignora por enquanto, pouco específico

    // Pattern: "Book X of [Series Name]"
    const bookOfMatch = subtitle.match(/book\s+([a-z]+|\d+)\s+of\s+(.+?)(?:\)|,|$)/i);
    if (bookOfMatch) {
      const [, posLabel, seriesName] = bookOfMatch;
      const posNum = this.parsePositionLabel(posLabel);
      return {
        name: seriesName.trim(),
        positionInSeries: posNum,
        positionLabel: posLabel,
        metadataSource: this.source,
        metadataConfidence: 'medium',
      };
    }

    // Pattern: "(Series Name, Book X)"
    const parenMatch = subtitle.match(/\((.+?),\s*book\s+([a-z]+|\d+)\)/i);
    if (parenMatch) {
      const [, seriesName, posLabel] = parenMatch;
      const posNum = this.parsePositionLabel(posLabel);
      return {
        name: seriesName.trim(),
        positionInSeries: posNum,
        positionLabel: posLabel,
        metadataSource: this.source,
        metadataConfidence: 'medium',
      };
    }

    return undefined;
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
