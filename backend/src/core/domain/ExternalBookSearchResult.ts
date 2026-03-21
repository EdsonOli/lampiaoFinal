export interface ExternalBookSeriesMetadata {
  name: string;
  positionInSeries?: number;
  positionLabel?: string;
  totalBooksKnown?: number;
  universeName?: string;
  metadataSource: string;
  metadataConfidence: 'low' | 'medium' | 'high';
}

export interface ExternalBookSearchResult {
  externalId: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedYear?: number;
  description?: string;
  isbns: string[];
  coverUrl?: string;
  categories: string[];
  language?: string;
  source: string;
  series?: ExternalBookSeriesMetadata;
}
