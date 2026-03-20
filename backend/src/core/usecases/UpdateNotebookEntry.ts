import { Notebook } from '../domain/Notebook';
import { NotebookRepository, UpdateNotebookInput } from '../ports/NotebookRepository';

export class UpdateNotebookEntry {
  constructor(private readonly notebookRepository: NotebookRepository) {}

  async execute(id: number, userId: number, input: UpdateNotebookInput): Promise<Notebook> {
    const notebook = await this.notebookRepository.findById(id);
    if (!notebook) {
      throw new Error('Notebook entry not found');
    }

    if (notebook.userId !== userId) {
      throw new Error('Forbidden notebook access');
    }

    const updatedNotebook = await this.notebookRepository.update(id, input);
    if (!updatedNotebook) {
      throw new Error('Notebook entry not found');
    }

    return updatedNotebook;
  }
}
