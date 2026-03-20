import { NextFunction, Response, Router } from 'express';
import { Container } from '../container';
import { authenticate, AuthenticatedRequest } from '../middlewares/authenticate';
import { toAdminUserDTO } from '../presenters/UserPresenter';
import { requireAdmin } from '../middlewares/requireAdmin';

const router = Router();

// Get use cases and repositories from container
const {
  getCommentById,
  getPostById,
  deleteComment,
  deletePost,
  deleteUser,
  getUserById,
  listAllComments,
  listAllPosts,
  listAllUsers,
} = Container.useCases;

// Todas as rotas exigem autenticação + role admin
router.use(authenticate, requireAdmin);

// --- Users ---

router.get('/users', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await listAllUsers.execute();
    res.json(users.map(toAdminUserDTO));
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid user id' });

    const user = await getUserById.execute(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(toAdminUserDTO(user));
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid user id' });

    await deleteUser.execute(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// --- Posts ---

router.get('/posts', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const posts = await listAllPosts.execute();
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

router.delete('/posts/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid post id' });

    const post = await getPostById.execute(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Admin pode deletar qualquer post sem checar autoria
    await deletePost.execute(id, post.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// --- Comments ---

router.get('/comments', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const comments = await listAllComments.execute();
    res.json(comments);
  } catch (error) {
    next(error);
  }
});

router.delete('/comments/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid comment id' });

    const comment = await getCommentById.execute(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    await deleteComment.execute(id, comment.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
