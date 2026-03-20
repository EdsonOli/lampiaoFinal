import { Notebook } from '../../core/domain/Notebook';
import {
  CreateNotebookInput,
  NotebookRepository,
  UpdateNotebookInput,
} from '../../core/ports/NotebookRepository';
import { Notebook as NotebookModel } from '../models/NotebookModel';

function mapNotebook(notebook: NotebookModel): Notebook {
  return {
    id: notebook.id,
    userId: notebook.user_id,
    bookId: notebook.book_id,
    grade: notebook.grade,
    status: notebook.status as Notebook['status'],
    favorite: notebook.favorite,
  };
}

export class SequelizeNotebookRepository implements NotebookRepository {
  async findAll(): Promise<Notebook[]> {
    const notebooks = await NotebookModel.findAll();
    return notebooks.map(mapNotebook);
  }

  async create(input: CreateNotebookInput): Promise<Notebook> {
    const notebook = await NotebookModel.create({
      user_id: input.userId,
      book_id: input.bookId,
      grade: input.grade,
      status: input.status,
      favorite: input.favorite ?? false,
    });

    return mapNotebook(notebook);
  }

  async findById(id: string): Promise<Notebook | null> {
    const notebook = await NotebookModel.findByPk(id);
    return notebook ? mapNotebook(notebook) : null;
  }

  async findByUserId(userId: string): Promise<Notebook[]> {
    const notebooks = await NotebookModel.findAll({ where: { user_id: userId } });
    return notebooks.map(mapNotebook);
  }

  async findByBookId(bookId: string): Promise<Notebook[]> {
    const notebooks = await NotebookModel.findAll({ where: { book_id: bookId } });
    return notebooks.map(mapNotebook);
  }

  async findByUserAndBook(userId: string, bookId: string): Promise<Notebook | null> {
    const notebook = await NotebookModel.findOne({
      where: {
        user_id: userId,
        book_id: bookId,
      },
    });

    return notebook ? mapNotebook(notebook) : null;
  }

  async update(id: string, input: UpdateNotebookInput): Promise<Notebook | null> {
    const notebook = await NotebookModel.findByPk(id);
    if (!notebook) {
      return null;
    }

    await notebook.update({
      grade: input.grade ?? notebook.grade,
      status: input.status ?? notebook.status,
      favorite: input.favorite ?? notebook.favorite,
    });

    return mapNotebook(notebook);
  }

  async delete(id: string): Promise<void> {
    await NotebookModel.destroy({ where: { id } });
  }
}
