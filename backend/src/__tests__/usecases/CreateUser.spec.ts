import { CreateUser } from '../../core/usecases/CreateUser';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { FakePasswordHasher } from '../fakes/FakePasswordHasher';

describe('CreateUser', () => {
  let userRepo: InMemoryUserRepository;
  let hasher: FakePasswordHasher;
  let sut: CreateUser;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    hasher = new FakePasswordHasher();
    sut = new CreateUser(userRepo, hasher);
  });

  it('should create a user with a hashed password', async () => {
    const user = await sut.execute({
      name: 'João Silva',
      email: 'joao@example.com',
      nickname: 'joao',
      password: 'senha123',
    });

    expect(user.id).toEqual(expect.any(String));
    expect(user.name).toBe('João Silva');
    expect(user.email).toBe('joao@example.com');
    expect(user.password).toBe('hashed:senha123');
  });

  it('should throw if email is already registered', async () => {
    await sut.execute({
      name: 'João Silva',
      email: 'joao@example.com',
      nickname: 'joao',
      password: 'senha123',
    });

    await expect(
      sut.execute({
        name: 'Outro João',
        email: 'joao@example.com',
        nickname: 'outro-joao',
        password: 'outrasenha',
      })
    ).rejects.toThrow('User already exists');
  });

  it('should assign unique ids to users', async () => {
    const user1 = await sut.execute({ name: 'A', email: 'a@x.com', nickname: 'a', password: '1' });
    const user2 = await sut.execute({ name: 'B', email: 'b@x.com', nickname: 'b', password: '2' });

    expect(user1.id).toEqual(expect.any(String));
    expect(user2.id).toEqual(expect.any(String));
    expect(user1.id).not.toBe(user2.id);
  });
});
