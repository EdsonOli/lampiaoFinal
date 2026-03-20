import { User } from '../domain/User';

export interface CreateUserInput {
  name: string;
  email: string;
  nickname: string;
  password: string;
  img?: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  nickname?: string;
  password?: string;
  img?: string;
}

export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User | null>;
  delete(id: string): Promise<void>;
}
