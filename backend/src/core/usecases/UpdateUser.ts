import { User } from '../domain/User';
import { ConflictError, NotFoundError } from '../errors';
import { PasswordHasher } from '../ports/PasswordHasher';
import { UpdateUserInput, UserRepository } from '../ports/UserRepository';

export class UpdateUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (input.email && input.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(input.email);
      if (existingUser) {
        throw new ConflictError('Email already in use');
      }
    }

    const updateData: UpdateUserInput = { ...input };
    if (input.password) {
      updateData.password = await this.passwordHasher.hash(input.password);
    } else {
      delete updateData.password;
    }

    const updatedUser = await this.userRepository.update(id, updateData);

    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }

    return updatedUser;
  }
}
