import { NextFunction, Request, Response, Router } from 'express';
import { CreateComment } from '../../core/usecases/CreateComment';
import { DeleteComment } from '../../core/usecases/DeleteComment';
import { GetCommentById } from '../../core/usecases/GetCommentById';
import { ListAllComments } from '../../core/usecases/ListAllComments';
import { ListCommentsByPost } from '../../core/usecases/ListCommentsByPost';
import { ListCommentsByUser } from '../../core/usecases/ListCommentsByUser';
import { UpdateComment } from '../../core/usecases/UpdateComment';
import { AuthenticatedRequest, authenticate } from '../middlewares/authenticate';
import { SequelizeCommentRepository } from '../repositories/SequelizeCommentRepository';
import { SequelizePostRepository } from '../repositories/SequelizePostRepository';

const router = Router();
const commentRepository = new SequelizeCommentRepository();
const postRepository = new SequelizePostRepository();
const createComment = new CreateComment(commentRepository, postRepository);
const getCommentById = new GetCommentById(commentRepository);
const listAllComments = new ListAllComments(commentRepository);
const listCommentsByPost = new ListCommentsByPost(commentRepository);
const listCommentsByUser = new ListCommentsByUser(commentRepository);
const updateComment = new UpdateComment(commentRepository);
const deleteComment = new DeleteComment(commentRepository);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const comments = await listAllComments.execute();
    res.json(comments);
  } catch (error) {
    next(error);
  }
});

router.get('/post/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const comments = await listCommentsByPost.execute(id);
    res.json(comments);
  } catch (error) {
    next(error);
  }
});

router.get('/user/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const comments = await listCommentsByUser.execute(id);
    res.json(comments);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid comment id' });
    }

    const comment = await getCommentById.execute(id);
    if (!comment) {
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
    const { title, text, postId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!title || !text || !Number.isInteger(postId)) {
      return res.status(400).json({ message: 'Invalid comment payload' });
    }

    const comment = await createComment.execute({
      title,
      text,
      postId,
      userId,
    });

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const id = Number(req.params.id);
    const { title, text } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid comment id' });
    }

    const comment = await updateComment.execute(id, userId, { title, text });
    res.json(comment);
  } catch (error) {
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
      return res.status(400).json({ message: 'Invalid comment id' });
    }

    await deleteComment.execute(id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
