import { NextFunction, Request, Response, Router } from 'express';
import { Container } from '../container';
import { AuthenticatedRequest, authenticate, optionalAuthenticate } from '../middlewares/authenticate';
import { auditLog } from '../services/AuditLogger';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { sanitizePlainText } from '../validation/sanitizers';
import { createPostSchema, updatePostSchema } from '../validation/schemas';

const router = Router();

// Get use cases from container
const {
  createPost,
  deletePost,
  getPostById,
  listAllPosts,
  listPostsByBook,
  listPostsByUser,
  updatePost,
} = Container.useCases;

function canViewPost(post: { isItPublic: boolean; userId: string }, currentUserId?: string): boolean {
  return post.isItPublic || (currentUserId !== undefined && post.userId === currentUserId);
}

router.get('/', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const posts = await listAllPosts.execute();
    const currentUserId = req.auth?.userId;
    res.json(posts.filter(post => canViewPost(post, currentUserId)));
  } catch (error) {
    next(error);
  }
});

router.get('/book/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'Invalid book id' });
    }

    const posts = await listPostsByBook.execute(id);
    const currentUserId = req.auth?.userId;
    res.json(posts.filter(post => canViewPost(post, currentUserId)));
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

    const posts = await listPostsByUser.execute(id);
    const currentUserId = req.auth?.userId;
    const isOwner = currentUserId === id;
    res.json(isOwner ? posts : posts.filter(post => post.isItPublic));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await getPostById.execute(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!canViewPost(post, req.auth?.userId)) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
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

    const payload = parseOrThrow(createPostSchema, req.body);

    const post = await createPost.execute({
      title: sanitizePlainText(payload.title),
      text: sanitizePlainText(payload.text),
      bookId: payload.bookId,
      userId,
      isItPublic: typeof payload.isItPublic === 'boolean' ? payload.isItPublic : true,
    });

    await auditLog('post.create', { postId: post.id, userId, bookId: post.bookId, isItPublic: post.isItPublic });

    res.status(201).json(post);
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
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const payload = parseOrThrow(updatePostSchema, req.body);

    const post = await updatePost.execute(id, userId, {
      title: payload.title ? sanitizePlainText(payload.title) : undefined,
      text: payload.text ? sanitizePlainText(payload.text) : undefined,
      isItPublic: typeof payload.isItPublic === 'boolean' ? payload.isItPublic : undefined,
    });

    await auditLog('post.update', { postId: id, userId, updatedFields: Object.keys(payload) });

    res.json(post);
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
      return res.status(400).json({ message: 'Invalid post id' });
    }

    await deletePost.execute(id, userId);
  await auditLog('post.delete', { postId: id, userId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
