import { User } from '../domain/User';

export interface CreateUserInput {
  name: string;
  email: string;
  nickname: string;
  password?: string;
  img?: string;
  authProvider?: 'local' | 'google';
  providerId?: string;
  emailVerified?: boolean;
  role?: 'user' | 'admin';
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  nickname?: string;
  password?: string;
  img?: string;
  authProvider?: 'local' | 'google';
  providerId?: string;
  emailVerified?: boolean;
}

export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByProviderId(providerId: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User | null>;
  delete(id: string): Promise<void>;
}
