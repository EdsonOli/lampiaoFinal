import { User } from '../domain/User';
import { UserRepository } from '../ports/UserRepository';

export class GetUserById {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
