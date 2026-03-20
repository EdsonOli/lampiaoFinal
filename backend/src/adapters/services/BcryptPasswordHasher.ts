import bcrypt from 'bcryptjs';
import { PasswordHasher } from '../../core/ports/PasswordHasher';

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, 10);
  }

  async compare(value: string, hashedValue: string): Promise<boolean> {
    return bcrypt.compare(value, hashedValue);
  }
}
