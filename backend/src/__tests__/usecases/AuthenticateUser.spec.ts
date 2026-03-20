import { AuthenticateUser } from '../../core/usecases/AuthenticateUser';
import { CreateUser } from '../../core/usecases/CreateUser';
import { FakePasswordHasher } from '../fakes/FakePasswordHasher';
import { FakeTokenService } from '../fakes/FakeTokenService';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';

describe('AuthenticateUser', () => {
  let userRepo: InMemoryUserRepository;
  let hasher: FakePasswordHasher;
  let tokenService: FakeTokenService;
  let sut: AuthenticateUser;
  let userId: string;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    hasher = new FakePasswordHasher();
    tokenService = new FakeTokenService();
    sut = new AuthenticateUser(userRepo, hasher, tokenService);

    // Registra usuário de teste via use case (garante senha hasheada)
    const createUser = new CreateUser(userRepo, hasher);
    const user = await createUser.execute({
      name: 'Maria Joaquina',
      email: 'maria@example.com',
      nickname: 'maria',
      password: 'senha123',
    });
    userId = user.id;
  });

  it('should return a token and userId on valid credentials', async () => {
    const result = await sut.execute({ email: 'maria@example.com', password: 'senha123' });

    expect(result.token).toContain('token:');
    expect(result.userId).toBe(userId);
  });

  it('should throw on non-existent email', async () => {
    await expect(
      sut.execute({ email: 'naoexiste@example.com', password: 'qualquer' })
    ).rejects.toThrow('Invalid credentials');
  });

  it('should throw on wrong password', async () => {
    await expect(
      sut.execute({ email: 'maria@example.com', password: 'senhaerrada' })
    ).rejects.toThrow('Invalid credentials');
  });

  it('should embed userId and email in the token payload', async () => {
    const result = await sut.execute({ email: 'maria@example.com', password: 'senha123' });
    const payload = await tokenService.verify(result.token);

    expect(payload.sub).toBe(userId);
    expect(payload.email).toBe('maria@example.com');
  });
});
