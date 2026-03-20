import { NextFunction, Response, Router } from 'express';
import { DeleteComment } from '../../core/usecases/DeleteComment';
import { DeletePost } from '../../core/usecases/DeletePost';
import { DeleteUser } from '../../core/usecases/DeleteUser';
import { GetUserById } from '../../core/usecases/GetUserById';
import { ListAllComments } from '../../core/usecases/ListAllComments';
import { ListAllPosts } from '../../core/usecases/ListAllPosts';
import { authenticate, AuthenticatedRequest } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import { SequelizeCommentRepository } from '../repositories/SequelizeCommentRepository';
import { SequelizePostRepository } from '../repositories/SequelizePostRepository';
import { SequelizeUserRepository } from '../repositories/SequelizeUserRepository';

const router = Router();

const userRepository = new SequelizeUserRepository();
const postRepository = new SequelizePostRepository();
const commentRepository = new SequelizeCommentRepository();

const getUserById = new GetUserById(userRepository);
const deleteUser = new DeleteUser(userRepository);
const listAllPosts = new ListAllPosts(postRepository);
const deletePost = new DeletePost(postRepository);
const listAllComments = new ListAllComments(commentRepository);
const deleteComment = new DeleteComment(commentRepository);

// Todas as rotas exigem autenticação + role admin
router.use(authenticate, requireAdmin);

function sanitizeUser(user: { id: number; name: string; email: string; nickname: string; role: string; img?: string }) {
  return { id: user.id, name: user.name, email: user.email, nickname: user.nickname, role: user.role, img: user.img };
}

// --- Users ---

router.get('/users', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await userRepository.findAll();
    res.json(users.map(sanitizeUser));
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid user id' });

    const user = await getUserById.execute(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid user id' });

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
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid post id' });

    const post = await postRepository.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Admin pode deletar qualquer post sem checar autoria
    await postRepository.delete(id);
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
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid comment id' });

    const comment = await commentRepository.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    await commentRepository.delete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
