import { PasswordHasher } from '../ports/PasswordHasher';
import { TokenService } from '../ports/TokenService';
import { UserRepository } from '../ports/UserRepository';

const DUMMY_BCRYPT_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8sV1QJQ6Q0imeISFRCGDpa2BkLomqK';

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
    const hashedPassword = user?.password ?? DUMMY_BCRYPT_HASH;
    const passwordsMatch = await this.passwordHasher.compare(input.password, hashedPassword);

    if (!user || !passwordsMatch) {
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
