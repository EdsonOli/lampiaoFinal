import { NextFunction, Response, Router } from 'express';
import { Container } from '../container';
import { AuthenticatedRequest, authenticate } from '../middlewares/authenticate';
import { auditLog } from '../services/AuditLogger';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { bookCoverUploadSchema, profileImageUploadSchema } from '../validation/schemas';

const router = Router();

const { createProfileImageUploadUrl, createBookCoverUploadUrl } = Container.useCases;

router.post('/profile/sign', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = parseOrThrow(profileImageUploadSchema, req.body);

    const signed = await createProfileImageUploadUrl.execute({
      userId,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
    });

    await auditLog('upload.profile.sign', {
      userId,
      path: signed.path,
      mimeType: payload.mimeType,
    });

    res.json(signed);
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json({ message: getValidationMessage(error) });
    }

    next(error);
  }
});

router.post('/book-cover/sign', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payload = parseOrThrow(bookCoverUploadSchema, req.body);
    const role = req.auth?.role;
    const requesterUserId = req.auth?.userId;

    if (!role || !requesterUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const signed = await createBookCoverUploadUrl.execute({
      requesterRole: role,
      requesterUserId,
      bookId: payload.bookId,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
    });

    await auditLog('upload.bookCover.sign', {
      userId: req.auth?.userId,
      bookId: payload.bookId,
      path: signed.path,
      mimeType: payload.mimeType,
    });

    res.json(signed);
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json({ message: getValidationMessage(error) });
    }

    next(error);
  }
});

export default router;
