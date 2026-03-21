export interface BookSeries {
  id: string;
  name: string;
  universeName?: string;
  metadataSource?: string;
  metadataConfidence: 'low' | 'medium' | 'high';
}

export interface BookSeriesEntry {
  id: string;
  bookId: string;
  seriesId: string;
  positionInSeries?: number;
  positionLabel?: string;
}

/**
 * Book enriched with series information
 * Used for read operations that need full context
 */
export interface BookWithSeries {
  id: string;
  name: string;
  isbn: string;
  publishingCompany: string;
  writer: string;
  genre: string;
  nPages: number;
  yearPublication: number;
  img?: string;
  synopsis?: string;
  series?: BookSeries & {
    positionInSeries?: number;
    positionLabel?: string;
  };
}
