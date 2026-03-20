import { NextFunction, Request, Response, Router } from 'express';
import { Container } from '../container';
import { AuthenticatedRequest, authenticate, optionalAuthenticate } from '../middlewares/authenticate';
import { auditLog } from '../services/AuditLogger';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { sanitizePlainText } from '../validation/sanitizers';
import { createCommentSchema, updateCommentSchema } from '../validation/schemas';

const router = Router();

// Get use cases and repositories from container
const {
  createComment,
  deleteComment,
  getCommentById,
  getPostById,
  listAllComments,
  listCommentsByPost,
  listCommentsByUser,
  updateComment,
} = Container.useCases;

async function canViewPostById(postId: string, currentUserId?: string): Promise<boolean> {
  const post = await getPostById.execute(postId);
  if (!post) {
    return false;
  }

  return post.isItPublic || (currentUserId !== undefined && post.userId === currentUserId);
}

router.get('/', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const comments = await listAllComments.execute();
    const currentUserId = req.auth?.userId;
    const visibleComments = [];

    for (const comment of comments) {
      if (await canViewPostById(comment.postId, currentUserId)) {
        visibleComments.push(comment);
      }
    }

    res.json(visibleComments);
  } catch (error) {
    next(error);
  }
});

router.get('/post/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const canView = await canViewPostById(id, req.auth?.userId);
    if (!canView) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await listCommentsByPost.execute(id);
    res.json(comments);
  } catch (error) {
    next(error);
  }
});

router.get('/user/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const comments = await listCommentsByUser.execute(id);
    const currentUserId = req.auth?.userId;
    const visibleComments = [];

    for (const comment of comments) {
      if (currentUserId === id || await canViewPostById(comment.postId, currentUserId)) {
        visibleComments.push(comment);
      }
    }

    res.json(visibleComments);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'Invalid comment id' });
    }

    const comment = await getCommentById.execute(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const canView = await canViewPostById(comment.postId, req.auth?.userId);
    if (!canView) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json(comment);
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

    const payload = parseOrThrow(createCommentSchema, req.body);

    const comment = await createComment.execute({
      title: sanitizePlainText(payload.title),
      text: sanitizePlainText(payload.text),
      postId: payload.postId,
      userId,
    });

    await auditLog('comment.create', { commentId: comment.id, userId, postId: comment.postId });

    res.status(201).json(comment);
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
      return res.status(400).json({ message: 'Invalid comment id' });
    }

    const payload = parseOrThrow(updateCommentSchema, req.body);
    const comment = await updateComment.execute(id, userId, {
      title: payload.title ? sanitizePlainText(payload.title) : undefined,
      text: payload.text ? sanitizePlainText(payload.text) : undefined,
    });
    await auditLog('comment.update', { commentId: id, userId, updatedFields: Object.keys(payload) });
    res.json(comment);
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
      return res.status(400).json({ message: 'Invalid comment id' });
    }

    await deleteComment.execute(id, userId);
  await auditLog('comment.delete', { commentId: id, userId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
