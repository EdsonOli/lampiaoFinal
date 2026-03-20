import { NextFunction, Request, Response, Router } from 'express';
import { CreatePost } from '../../core/usecases/CreatePost';
import { DeletePost } from '../../core/usecases/DeletePost';
import { GetPostById } from '../../core/usecases/GetPostById';
import { ListAllPosts } from '../../core/usecases/ListAllPosts';
import { ListPostsByBook } from '../../core/usecases/ListPostsByBook';
import { ListPostsByUser } from '../../core/usecases/ListPostsByUser';
import { UpdatePost } from '../../core/usecases/UpdatePost';
import { AuthenticatedRequest, authenticate } from '../middlewares/authenticate';
import { SequelizeBookRepository } from '../repositories/SequelizeBookRepository';
import { SequelizePostRepository } from '../repositories/SequelizePostRepository';

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

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const posts = await listAllPosts.execute();
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

router.get('/book/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid book id' });
    }

    const posts = await listPostsByBook.execute(id);
    res.json(posts);
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

    const posts = await listPostsByUser.execute(id);
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await getPostById.execute(id);
    if (!post) {
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
    const { title, text, bookId, isItPublic } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!title || !text || !Number.isInteger(bookId)) {
      return res.status(400).json({ message: 'Invalid post payload' });
    }

    const post = await createPost.execute({
      title,
      text,
      bookId,
      userId,
      isItPublic: typeof isItPublic === 'boolean' ? isItPublic : true,
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const id = Number(req.params.id);
    const { title, text, isItPublic } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await updatePost.execute(id, userId, {
      title,
      text,
      isItPublic: typeof isItPublic === 'boolean' ? isItPublic : undefined,
    });

    res.json(post);
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
      return res.status(400).json({ message: 'Invalid post id' });
    }

    await deletePost.execute(id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
