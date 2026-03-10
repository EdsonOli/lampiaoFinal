/**
 * Modelos para o domínio de Library (Biblioteca Pessoal)
 */

export enum ReadingStatus {
  WantToRead = 0,
  Reading = 1,
  Read = 2
}

export interface UserBookDto {
  id: string;
  userId: string;
  bookId: string;
  readingStatus: ReadingStatus;
  rating?: number;
  isFavorite: boolean;
  notes?: string;
  startDate?: Date;
  endDate?: Date;
  creationTime: Date;
  
  // Navigation properties
  book?: {
    id: string;
    name: string;
    author?: string;
    imageUrl?: string;
  };
}

export interface AddToLibraryDto {
  bookId: string;
  readingStatus: ReadingStatus;
  rating?: number;
  isFavorite?: boolean;
  notes?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateUserBookDto {
  readingStatus?: ReadingStatus;
  rating?: number;
  isFavorite?: boolean;
  notes?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface LibraryStatisticsDto {
  totalBooks: number;
  booksRead: number;
  booksReading: number;
  booksWantToRead: number;
  averageRating: number;
  totalPagesRead: number;
  favoriteGenre?: string;
}

export interface GetUserBooksInput {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  readingStatus?: ReadingStatus;
  isFavorite?: boolean;
  genre?: string;
}

export const ReadingStatusLabels: Record<ReadingStatus, string> = {
  [ReadingStatus.WantToRead]: 'Quero Ler',
  [ReadingStatus.Reading]: 'Lendo',
  [ReadingStatus.Read]: 'Lido'
};

export const ReadingStatusColors: Record<ReadingStatus, string> = {
  [ReadingStatus.WantToRead]: 'warning',
  [ReadingStatus.Reading]: 'info',
  [ReadingStatus.Read]: 'success'
};
