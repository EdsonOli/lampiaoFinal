import { ExternalBookSearchResult } from '../domain/ExternalBookSearchResult';

export interface ExternalBookSearchQuery {
  query: string;
  startIndex: number;
  maxResults: number;
}

export interface ExternalBookSearchProvider {
  readonly source: string;
  search(input: ExternalBookSearchQuery): Promise<ExternalBookSearchResult[]>;
}
