import { NextFunction, Response, Router } from 'express';
import { Container } from '../container';
import { AuthenticatedRequest, authenticate } from '../middlewares/authenticate';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { createNotebookSchema, updateNotebookSchema } from '../validation/schemas';
import { badRequest, unauthorized, validationError } from '../http/respondError';

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
      return unauthorized(res, 'Voce precisa estar autenticado para listar seus registros de leitura.', 'NOTEBOOK_LIST_AUTH_REQUIRED');
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
      return unauthorized(res, 'Voce precisa estar autenticado para criar um registro de leitura.', 'NOTEBOOK_CREATE_AUTH_REQUIRED');
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
      return validationError(res, getValidationMessage(error), 'NOTEBOOK_CREATE_INVALID_PAYLOAD');
    }

    next(error);
  }
});

router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const id = String(req.params.id);

    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para atualizar um registro de leitura.', 'NOTEBOOK_UPDATE_AUTH_REQUIRED');
    }

    if (!id) {
      return badRequest(res, 'O identificador do registro de leitura informado e invalido.', 'NOTEBOOK_ID_INVALID');
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
      return validationError(res, getValidationMessage(error), 'NOTEBOOK_UPDATE_INVALID_PAYLOAD');
    }

    next(error);
  }
});

router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const id = String(req.params.id);

    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para excluir um registro de leitura.', 'NOTEBOOK_DELETE_AUTH_REQUIRED');
    }

    if (!id) {
      return badRequest(res, 'O identificador do registro de leitura informado e invalido.', 'NOTEBOOK_ID_INVALID');
    }

    await deleteNotebookEntry.execute(id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
