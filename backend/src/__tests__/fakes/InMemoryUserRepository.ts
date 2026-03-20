import { User } from '../../core/domain/User';
import { CreateUserInput, UpdateUserInput, UserRepository } from '../../core/ports/UserRepository';

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];
  private counter = 1;

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async findById(id: number): Promise<User | null> {
    return this.users.find(u => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) ?? null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const user: User = { id: this.counter++, role: 'user', ...input };
    this.users.push(user);
    return user;
  }

  async update(id: number, input: UpdateUserInput): Promise<User | null> {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...input };
    return this.users[idx];
  }

  async delete(id: number): Promise<void> {
    this.users = this.users.filter(u => u.id !== id);
  }
}
