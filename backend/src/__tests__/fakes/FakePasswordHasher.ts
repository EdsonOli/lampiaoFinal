import { PasswordHasher } from '../../core/ports/PasswordHasher';

export class FakePasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    return `hashed:${value}`;
  }

  async compare(value: string, hashedValue: string): Promise<boolean> {
    return hashedValue === `hashed:${value}`;
  }
}
