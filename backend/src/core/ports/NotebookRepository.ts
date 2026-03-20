import { Notebook } from '../domain/Notebook';

export interface CreateNotebookInput {
  userId: number;
  bookId: number;
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
  findById(id: number): Promise<Notebook | null>;
  findByUserId(userId: number): Promise<Notebook[]>;
  findByBookId(bookId: number): Promise<Notebook[]>;
  findByUserAndBook(userId: number, bookId: number): Promise<Notebook | null>;
  create(input: CreateNotebookInput): Promise<Notebook>;
  update(id: number, input: UpdateNotebookInput): Promise<Notebook | null>;
  delete(id: number): Promise<void>;
}
