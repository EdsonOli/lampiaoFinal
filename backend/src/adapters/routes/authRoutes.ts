import { NextFunction, Request, Response, Router } from 'express';
import { AuthenticateUser } from '../../core/usecases/AuthenticateUser';
import { CreateUser } from '../../core/usecases/CreateUser';
import { SequelizeUserRepository } from '../repositories/SequelizeUserRepository';
import { BcryptPasswordHasher } from '../services/BcryptPasswordHasher';
import { JwtTokenService } from '../services/JwtTokenService';

const router = Router();
const userRepository = new SequelizeUserRepository();
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();
const createUser = new CreateUser(userRepository, passwordHasher);
const authenticateUser = new AuthenticateUser(userRepository, passwordHasher, tokenService);

function sanitizeUser(user: { id: number; name: string; email: string; nickname: string; img?: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    nickname: user.nickname,
    img: user.img,
  };
}

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, nickname, password, img } = req.body;

    if (!name || !email || !nickname || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await createUser.execute({
      name,
      email,
      nickname,
      password,
      img,
    });

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const auth = await authenticateUser.execute({ email, password });
    const user = await userRepository.findById(auth.userId);

    res.json({
      token: auth.token,
      user: user ? sanitizeUser(user) : null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
