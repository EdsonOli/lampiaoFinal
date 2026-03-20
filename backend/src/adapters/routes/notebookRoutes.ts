import { NextFunction, Request, Response, Router } from 'express';
import { Container } from '../container';
import { AuthenticatedRequest, authenticate } from '../middlewares/authenticate';

const router = Router();

// Get use cases and repositories from container
const {
  createNotebookEntry,
  deleteNotebookEntry,
  listUserNotebooks,
  updateNotebookEntry,
} = Container.useCases;
const { notebook: notebookRepository, book: bookRepository } = Container.repositories;
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
    const id = String(req.params.id);
    const { grade, status, favorite } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!id) {
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
    const id = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Invalid notebook id' });
    }

    await deleteNotebookEntry.execute(id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
