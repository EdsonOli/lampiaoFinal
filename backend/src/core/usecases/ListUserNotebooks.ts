import { Notebook } from '../domain/Notebook';
import { NotebookRepository } from '../ports/NotebookRepository';

export class ListUserNotebooks {
  constructor(private readonly notebookRepository: NotebookRepository) {}

  async execute(userId: string): Promise<Notebook[]> {
    return this.notebookRepository.findByUserId(userId);
  }
}
