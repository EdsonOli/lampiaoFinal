import { NextFunction, Response, Router } from 'express';
import { Container } from '../container';
import { ValidationError } from '../../core/errors';
import { AuthenticatedRequest, authenticate } from '../middlewares/authenticate';
import { toPublicUserDTO } from '../presenters/UserPresenter';
import { getAuthCookieOptions, getRefreshCookieOptions, AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from '../security/authCookie';
import { auditLog } from '../services/AuditLogger';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { sanitizeOptionalPlainText, sanitizeProfileImageUrl } from '../validation/sanitizers';
import { updateMeSchema } from '../validation/schemas';
import { badRequest, notFound, unauthorized, validationError } from '../http/respondError';

const router = Router();

// Get use cases from container
const { getUserById, updateUser, deleteUser } = Container.useCases;

router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para acessar seu perfil.', 'USER_ME_AUTH_REQUIRED');
    }

    const user = await getUserById.execute(userId);
    if (!user) {
      return notFound(res, 'O usuario autenticado nao foi encontrado.', 'USER_ME_NOT_FOUND');
    }

    res.json(toPublicUserDTO(user));
  } catch (error) {
    next(error);
  }
});

router.put('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para atualizar seu perfil.', 'USER_UPDATE_AUTH_REQUIRED');
    }

    const payload = parseOrThrow(updateMeSchema, req.body);
    const user = await updateUser.execute(userId, {
      name: sanitizeOptionalPlainText(payload.name),
      email: payload.email,
      nickname: sanitizeOptionalPlainText(payload.nickname),
      password: payload.password,
      img: sanitizeProfileImageUrl(payload.img),
    });

    await auditLog('user.updateMe', { userId, updatedFields: Object.keys(payload) });

    res.json(toPublicUserDTO(user));
  } catch (error) {
    if (isValidationError(error)) {
      return validationError(res, getValidationMessage(error), 'USER_UPDATE_INVALID_PAYLOAD');
    }

    if (error instanceof ValidationError) {
      return validationError(res, error.message, 'USER_UPDATE_INVALID_DATA');
    }

    next(error);
  }
});

router.delete('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para excluir sua conta.', 'USER_DELETE_AUTH_REQUIRED');
    }

    await deleteUser.execute(userId);
    res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
    await auditLog('user.deleteMe', { userId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return badRequest(res, 'O identificador do usuario informado e invalido.', 'USER_ID_INVALID');
    }

    const user = await getUserById.execute(id);
    if (!user) {
      return notFound(res, 'O usuario solicitado nao foi encontrado.', 'USER_NOT_FOUND');
    }

    res.json(toPublicUserDTO(user));
  } catch (error) {
    next(error);
  }
});

export default router;
