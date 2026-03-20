import { User } from '../../core/domain/User';
import { CreateUserInput, UpdateUserInput, UserRepository } from '../../core/ports/UserRepository';
import { randomUUID } from 'crypto';

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) ?? null;
  }

  async findByProviderId(providerId: string): Promise<User | null> {
    return this.users.find(u => u.providerId === providerId) ?? null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const user: User = { id: randomUUID(), role: 'user', ...input };
    this.users.push(user);
    return user;
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...input };
    return this.users[idx];
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== id);
  }
}
