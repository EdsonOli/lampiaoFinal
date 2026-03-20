import { NextFunction, Request, Response, Router } from 'express';
import { CreatePost } from '../../core/usecases/CreatePost';
import { DeletePost } from '../../core/usecases/DeletePost';
import { GetPostById } from '../../core/usecases/GetPostById';
import { ListAllPosts } from '../../core/usecases/ListAllPosts';
import { ListPostsByBook } from '../../core/usecases/ListPostsByBook';
import { ListPostsByUser } from '../../core/usecases/ListPostsByUser';
import { UpdatePost } from '../../core/usecases/UpdatePost';
import { AuthenticatedRequest, authenticate, optionalAuthenticate } from '../middlewares/authenticate';
import { SequelizeBookRepository } from '../repositories/SequelizeBookRepository';
import { SequelizePostRepository } from '../repositories/SequelizePostRepository';
import { auditLog } from '../services/AuditLogger';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { sanitizePlainText } from '../validation/sanitizers';
import { createPostSchema, updatePostSchema } from '../validation/schemas';

const router = Router();
const postRepository = new SequelizePostRepository();
const bookRepository = new SequelizeBookRepository();
const createPost = new CreatePost(postRepository, bookRepository);
const getPostById = new GetPostById(postRepository);
const listAllPosts = new ListAllPosts(postRepository);
const listPostsByBook = new ListPostsByBook(postRepository);
const listPostsByUser = new ListPostsByUser(postRepository);
const updatePost = new UpdatePost(postRepository);
const deletePost = new DeletePost(postRepository);

function canViewPost(post: { isItPublic: boolean; userId: number }, currentUserId?: number): boolean {
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
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
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
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
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
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
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
    const id = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (Number.isNaN(id)) {
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
    const id = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (Number.isNaN(id)) {
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
