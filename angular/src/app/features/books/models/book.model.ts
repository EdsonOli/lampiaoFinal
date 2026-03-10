/**
 * Modelos para o domínio de Books (Catálogo de Livros)
 */

export interface BookDto {
  id: string;
  name: string;
  isbn?: string;
  publishingCompany?: string;
  author?: string;
  genre?: string;
  pageCount?: number;
  yearPublication?: number;
  imageUrl?: string;
  synopsis?: string;
  creationTime?: Date;
}

export interface CreateUpdateBookDto {
  name: string;
  isbn?: string;
  publishingCompany?: string;
  author?: string;
  genre?: string;
  pageCount?: number;
  yearPublication?: number;
  imageUrl?: string;
  synopsis?: string;
}

export interface GetBooksInput {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  filter?: string;
  author?: string;
  genre?: string;
}

export interface BookStatisticsDto {
  averageRating: number;
  totalRatings: number;
  totalFavorites: number;
  totalInLibraries: number;
}
