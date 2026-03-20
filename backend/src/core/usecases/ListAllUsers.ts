import { User } from '../domain/User';
import { UserRepository } from '../ports/UserRepository';

export class ListAllUsers {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
