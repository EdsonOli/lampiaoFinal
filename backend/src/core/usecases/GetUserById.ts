import { User } from '../domain/User';
import { UserRepository } from '../ports/UserRepository';

export class GetUserById {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
