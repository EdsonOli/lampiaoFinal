import { NotebookRepository } from '../ports/NotebookRepository';
import { NotFoundError, ForbiddenError } from '../errors';

export class DeleteNotebookEntry {
  constructor(private readonly notebookRepository: NotebookRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const notebook = await this.notebookRepository.findById(id);
    if (!notebook) {
      throw new NotFoundError('Notebook entry not found');
    }

    if (notebook.userId !== userId) {
      throw new ForbiddenError('Forbidden notebook access');
    }

    await this.notebookRepository.delete(id);
  }
}
