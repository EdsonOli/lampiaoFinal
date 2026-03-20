import { Notebook } from '../domain/Notebook';

export interface CreateNotebookInput {
  userId: string;
  bookId: string;
  grade?: number;
  status: Notebook['status'];
  favorite?: boolean;
}

export interface UpdateNotebookInput {
  grade?: number;
  status?: Notebook['status'];
  favorite?: boolean;
}

export interface NotebookRepository {
  findAll(): Promise<Notebook[]>;
  findById(id: string): Promise<Notebook | null>;
  findByUserId(userId: string): Promise<Notebook[]>;
  findByBookId(bookId: string): Promise<Notebook[]>;
  findByUserAndBook(userId: string, bookId: string): Promise<Notebook | null>;
  create(input: CreateNotebookInput): Promise<Notebook>;
  update(id: string, input: UpdateNotebookInput): Promise<Notebook | null>;
  delete(id: string): Promise<void>;
}
