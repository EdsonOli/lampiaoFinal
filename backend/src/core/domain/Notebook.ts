export type ReadingStatus = 'Lido' | 'Lendo' | 'Quero ler';

export interface Notebook {
  id: number;
  userId: number;
  bookId: number;
  grade?: number;
  status: ReadingStatus;
  favorite: boolean;
}
