import { NextFunction, Response, Router } from 'express';
import { DeleteUser } from '../../core/usecases/DeleteUser';
import { GetUserById } from '../../core/usecases/GetUserById';
import { UpdateUser } from '../../core/usecases/UpdateUser';
import { AuthenticatedRequest, authenticate } from '../middlewares/authenticate';
import { SequelizeUserRepository } from '../repositories/SequelizeUserRepository';
import { BcryptPasswordHasher } from '../services/BcryptPasswordHasher';

const router = Router();
const userRepository = new SequelizeUserRepository();
const passwordHasher = new BcryptPasswordHasher();
const getUserById = new GetUserById(userRepository);
const updateUser = new UpdateUser(userRepository, passwordHasher);
const deleteUser = new DeleteUser(userRepository);

function sanitizeUser(user: { id: number; name: string; email: string; nickname: string; img?: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    nickname: user.nickname,
    img: user.img,
  };
}

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

    res.json(sanitizeUser(user));
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

    const { name, email, nickname, password, img } = req.body;
    const user = await updateUser.execute(userId, { name, email, nickname, password, img });

    res.json(sanitizeUser(user));
  } catch (error) {
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
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await getUserById.execute(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
});

export default router;
