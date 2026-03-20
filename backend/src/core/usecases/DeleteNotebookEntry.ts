import { NotebookRepository } from '../ports/NotebookRepository';

export class DeleteNotebookEntry {
  constructor(private readonly notebookRepository: NotebookRepository) {}

  async execute(id: number, userId: number): Promise<void> {
    const notebook = await this.notebookRepository.findById(id);
    if (!notebook) {
      throw new Error('Notebook entry not found');
    }

    if (notebook.userId !== userId) {
      throw new Error('Forbidden notebook access');
    }

    await this.notebookRepository.delete(id);
  }
}
