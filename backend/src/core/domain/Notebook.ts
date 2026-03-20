export type ReadingStatus = 'Lido' | 'Lendo' | 'Quero ler';

export interface Notebook {
  id: string;
  userId: string;
  bookId: string;
  grade?: number;
  status: ReadingStatus;
  favorite: boolean;
}
