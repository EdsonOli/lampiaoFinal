import { Notebook } from '../domain/Notebook';
import { BookRepository } from '../ports/BookRepository';
import { CreateNotebookInput, NotebookRepository } from '../ports/NotebookRepository';
import { NotFoundError, ConflictError } from '../errors';

export class CreateNotebookEntry {
  constructor(
    private readonly notebookRepository: NotebookRepository,
    private readonly bookRepository: BookRepository
  ) {}

  async execute(input: CreateNotebookInput): Promise<Notebook> {
    const book = await this.bookRepository.findById(input.bookId);
    if (!book) {
      throw new NotFoundError('Book not found');
    }

    const existingNotebook = await this.notebookRepository.findByUserAndBook(input.userId, input.bookId);
    if (existingNotebook) {
      throw new ConflictError('Notebook entry already exists');
    }

    return this.notebookRepository.create(input);
  }
}
