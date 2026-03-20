import { NextFunction, Request, Response, Router } from 'express';
import { CreateNotebookEntry } from '../../core/usecases/CreateNotebookEntry';
import { DeleteNotebookEntry } from '../../core/usecases/DeleteNotebookEntry';
import { ListUserNotebooks } from '../../core/usecases/ListUserNotebooks';
import { UpdateNotebookEntry } from '../../core/usecases/UpdateNotebookEntry';
import { AuthenticatedRequest, authenticate } from '../middlewares/authenticate';
import { SequelizeBookRepository } from '../repositories/SequelizeBookRepository';
import { SequelizeNotebookRepository } from '../repositories/SequelizeNotebookRepository';

const router = Router();
const notebookRepository = new SequelizeNotebookRepository();
const bookRepository = new SequelizeBookRepository();
const createNotebookEntry = new CreateNotebookEntry(notebookRepository, bookRepository);
const listUserNotebooks = new ListUserNotebooks(notebookRepository);
const updateNotebookEntry = new UpdateNotebookEntry(notebookRepository);
const deleteNotebookEntry = new DeleteNotebookEntry(notebookRepository);
const validStatuses = new Set(['Lido', 'Lendo', 'Quero ler']);

function isValidStatus(value: unknown): value is 'Lido' | 'Lendo' | 'Quero ler' {
  return typeof value === 'string' && validStatuses.has(value);
}

router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notebooks = await listUserNotebooks.execute(userId);
    res.json(notebooks);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const { bookId, grade, status, favorite } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!Number.isInteger(bookId) || !isValidStatus(status)) {
      return res.status(400).json({ message: 'Invalid notebook payload' });
    }

    if (grade !== undefined && !Number.isInteger(grade)) {
      return res.status(400).json({ message: 'Grade must be an integer' });
    }

    const notebook = await createNotebookEntry.execute({
      userId,
      bookId,
      grade,
      status,
      favorite: Boolean(favorite),
    });

    res.status(201).json(notebook);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const id = Number(req.params.id);
    const { grade, status, favorite } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid notebook id' });
    }

    if (status !== undefined && !isValidStatus(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (grade !== undefined && !Number.isInteger(grade)) {
      return res.status(400).json({ message: 'Grade must be an integer' });
    }

    const notebook = await updateNotebookEntry.execute(id, userId, {
      grade,
      status,
      favorite: typeof favorite === 'boolean' ? favorite : undefined,
    });

    res.json(notebook);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const id = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid notebook id' });
    }

    await deleteNotebookEntry.execute(id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
