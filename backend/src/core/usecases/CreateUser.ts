import { User } from '../domain/User';
import { PasswordHasher } from '../ports/PasswordHasher';
import { CreateUserInput, UserRepository } from '../ports/UserRepository';

export class CreateUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await this.passwordHasher.hash(input.password);

    return this.userRepository.create({
      ...input,
      password: hashedPassword,
    });
  }
}
