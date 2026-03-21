import { ExternalBookSearchResult } from '../domain/ExternalBookSearchResult';
import { ExternalBookSearchProvider } from '../ports/ExternalBookSearchProvider';

export interface SearchExternalBooksInput {
  query: string;
  startIndex: number;
  maxResults: number;
}

export class SearchExternalBooks {
  constructor(private readonly providers: ExternalBookSearchProvider[]) {}

  async execute(input: SearchExternalBooksInput): Promise<ExternalBookSearchResult[]> {
    const providerResults = await Promise.all(
      this.providers.map((provider) =>
        provider.search({
          query: input.query,
          startIndex: input.startIndex,
          maxResults: input.maxResults,
        })
      )
    );

    const merged = providerResults.flat();
    return this.mergeAndDeduplicate(merged).slice(0, input.maxResults);
  }

  private mergeAndDeduplicate(results: ExternalBookSearchResult[]): ExternalBookSearchResult[] {
    const seenKeys = new Set<string>();
    const deduplicated: ExternalBookSearchResult[] = [];

    for (const result of results) {
      const comparableKeys = this.buildComparableKeys(result);
      const isDuplicate = comparableKeys.some((key) => seenKeys.has(key));
      if (isDuplicate) {
        continue;
      }

      comparableKeys.forEach((key) => seenKeys.add(key));
      deduplicated.push(result);
    }

    return deduplicated;
  }

  private buildComparableKeys(result: ExternalBookSearchResult): string[] {
    const normalizedIsbns = result.isbns
      .map((isbn) => isbn.replace(/[-\s]/g, '').toUpperCase())
      .filter((isbn) => isbn.length >= 10);

    if (normalizedIsbns.length > 0) {
      return normalizedIsbns.map((isbn) => `isbn:${isbn}`);
    }

    const normalizedAuthor = result.authors[0]?.trim().toLowerCase() || '';
    const normalizedTitle = result.title.trim().toLowerCase();
    return [`text:${normalizedTitle}::${normalizedAuthor}`];
  }
}
