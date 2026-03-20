import { Notebook } from '../domain/Notebook';
import { NotebookRepository, UpdateNotebookInput } from '../ports/NotebookRepository';
import { NotFoundError, ForbiddenError } from '../errors';

export class UpdateNotebookEntry {
  constructor(private readonly notebookRepository: NotebookRepository) {}

  async execute(id: string, userId: string, input: UpdateNotebookInput): Promise<Notebook> {
    const notebook = await this.notebookRepository.findById(id);
    if (!notebook) {
      throw new NotFoundError('Notebook entry not found');
    }

    if (notebook.userId !== userId) {
      throw new ForbiddenError('Forbidden notebook access');
    }

    const updatedNotebook = await this.notebookRepository.update(id, input);
    if (!updatedNotebook) {
      throw new NotFoundError('Notebook entry not found');
    }

    return updatedNotebook;
  }
}
