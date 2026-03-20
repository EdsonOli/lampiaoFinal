import { PasswordHasher } from '../ports/PasswordHasher';
import { TokenService } from '../ports/TokenService';
import { UserRepository } from '../ports/UserRepository';

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export interface AuthenticateUserOutput {
  token: string;
  userId: number;
}

export class AuthenticateUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const passwordsMatch = await this.passwordHasher.compare(input.password, user.password);
    if (!passwordsMatch) {
      throw new Error('Invalid credentials');
    }

    const token = await this.tokenService.sign({
      sub: String(user.id),
      email: user.email,
    });

    return {
      token,
      userId: user.id,
    };
  }
}
