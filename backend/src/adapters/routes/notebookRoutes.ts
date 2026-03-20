import { NextFunction, Response, Router } from 'express';
import { Container } from '../container';
import { AuthenticatedRequest, authenticate } from '../middlewares/authenticate';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { createNotebookSchema, updateNotebookSchema } from '../validation/schemas';

const router = Router();

// Get use cases and repositories from container
const {
  createNotebookEntry,
  deleteNotebookEntry,
  listUserNotebooks,
  updateNotebookEntry,
} = Container.useCases;

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

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = parseOrThrow(createNotebookSchema, req.body);

    const notebook = await createNotebookEntry.execute({
      userId,
      bookId: payload.bookId,
      grade: payload.grade,
      status: payload.status,
      favorite: payload.favorite ?? false,
    });

    res.status(201).json(notebook);
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json({ message: getValidationMessage(error) });
    }

    next(error);
  }
});

router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const id = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Invalid notebook id' });
    }

    const payload = parseOrThrow(updateNotebookSchema, req.body);

    const notebook = await updateNotebookEntry.execute(id, userId, {
      grade: payload.grade,
      status: payload.status,
      favorite: payload.favorite,
    });

    res.json(notebook);
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json({ message: getValidationMessage(error) });
    }

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
