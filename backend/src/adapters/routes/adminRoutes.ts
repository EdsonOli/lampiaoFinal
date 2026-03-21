import { NextFunction, Response, Router } from 'express';
import { Container } from '../container';
import { authenticate, AuthenticatedRequest } from '../middlewares/authenticate';
import { toAdminUserDTO } from '../presenters/UserPresenter';
import { requireAdmin } from '../middlewares/requireAdmin';
import { badRequest, notFound } from '../http/respondError';

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
    if (!id) return badRequest(res, 'O identificador do usuario informado e invalido.', 'ADMIN_USER_ID_INVALID');

    const user = await getUserById.execute(id);
    if (!user) return notFound(res, 'O usuario solicitado nao foi encontrado.', 'ADMIN_USER_NOT_FOUND');

    res.json(toAdminUserDTO(user));
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) return badRequest(res, 'O identificador do usuario informado e invalido.', 'ADMIN_USER_ID_INVALID');

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
    if (!id) return badRequest(res, 'O identificador do post informado e invalido.', 'ADMIN_POST_ID_INVALID');

    const post = await getPostById.execute(id);
    if (!post) return notFound(res, 'O post solicitado nao foi encontrado.', 'ADMIN_POST_NOT_FOUND');

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
    if (!id) return badRequest(res, 'O identificador do comentario informado e invalido.', 'ADMIN_COMMENT_ID_INVALID');

    const comment = await getCommentById.execute(id);
    if (!comment) return notFound(res, 'O comentario solicitado nao foi encontrado.', 'ADMIN_COMMENT_NOT_FOUND');

    await deleteComment.execute(id, comment.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
