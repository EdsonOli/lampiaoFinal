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

const router = Router();

// Get use cases from container
const { getUserById, updateUser, deleteUser } = Container.useCases;

router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await getUserById.execute(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
      return res.status(401).json({ message: 'Unauthorized' });
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
      return res.status(400).json({ message: getValidationMessage(error) });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
});

router.delete('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
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
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await getUserById.execute(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(toPublicUserDTO(user));
  } catch (error) {
    next(error);
  }
});

export default router;
