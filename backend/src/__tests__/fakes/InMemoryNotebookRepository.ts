import { Notebook } from '../../core/domain/Notebook';
import { CreateNotebookInput, NotebookRepository, UpdateNotebookInput } from '../../core/ports/NotebookRepository';

export class InMemoryNotebookRepository implements NotebookRepository {
  private notebooks: Notebook[] = [];
  private counter = 1;

  async findAll(): Promise<Notebook[]> {
    return [...this.notebooks];
  }

  async findById(id: number): Promise<Notebook | null> {
    return this.notebooks.find(n => n.id === id) ?? null;
  }

  async findByUserId(userId: number): Promise<Notebook[]> {
    return this.notebooks.filter(n => n.userId === userId);
  }

  async findByBookId(bookId: number): Promise<Notebook[]> {
    return this.notebooks.filter(n => n.bookId === bookId);
  }

  async findByUserAndBook(userId: number, bookId: number): Promise<Notebook | null> {
    return this.notebooks.find(n => n.userId === userId && n.bookId === bookId) ?? null;
  }

  async create(input: CreateNotebookInput): Promise<Notebook> {
    const notebook: Notebook = {
      id: this.counter++,
      favorite: false,
      ...input,
    };
    this.notebooks.push(notebook);
    return notebook;
  }

  async update(id: number, input: UpdateNotebookInput): Promise<Notebook | null> {
    const idx = this.notebooks.findIndex(n => n.id === id);
    if (idx === -1) return null;
    this.notebooks[idx] = { ...this.notebooks[idx], ...input };
    return this.notebooks[idx];
  }

  async delete(id: number): Promise<void> {
    this.notebooks = this.notebooks.filter(n => n.id !== id);
  }
}
