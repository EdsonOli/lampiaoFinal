import { NextFunction, Request, Response } from 'express';
import { JwtTokenService } from '../services/JwtTokenService';
import { SequelizeUserRepository } from '../repositories/SequelizeUserRepository';

const tokenService = new JwtTokenService();
const userRepository = new SequelizeUserRepository();

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: number;
    email: string;
    role: 'user' | 'admin';
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing bearer token' });
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = await tokenService.verify(token);
    const userId = Number(payload.sub);
    const user = await userRepository.findById(userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.auth = {
      userId,
      email: payload.email,
      role: user.role,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}
