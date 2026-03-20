import { User } from '../domain/User';
import { PasswordHasher } from '../ports/PasswordHasher';
import { CreateUserInput, UserRepository } from '../ports/UserRepository';
import { ConflictError, ValidationError } from '../errors';

export class CreateUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    if (!input.password) {
      throw new ValidationError('Password is required');
    }

    const hashedPassword = await this.passwordHasher.hash(input.password);

    return this.userRepository.create({
      ...input,
      password: hashedPassword,
    });
  }
}
