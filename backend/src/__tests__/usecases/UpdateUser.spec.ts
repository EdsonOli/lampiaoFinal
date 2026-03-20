import { CreateUser } from '../../core/usecases/CreateUser';
import { UpdateUser } from '../../core/usecases/UpdateUser';
import { FakePasswordHasher } from '../fakes/FakePasswordHasher';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';

describe('UpdateUser', () => {
  let userRepo: InMemoryUserRepository;
  let hasher: FakePasswordHasher;
  let sut: UpdateUser;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    hasher = new FakePasswordHasher();
    sut = new UpdateUser(userRepo, hasher);

    const createUser = new CreateUser(userRepo, hasher);
    await createUser.execute({
      name: 'Pedro Alves',
      email: 'pedro@example.com',
      nickname: 'pedro',
      password: 'senha123',
    });
    await createUser.execute({
      name: 'Ana Lima',
      email: 'ana@example.com',
      nickname: 'ana',
      password: 'outrasenha',
    });
  });

  it('should update name and nickname', async () => {
    const updated = await sut.execute(1, { name: 'Pedro Novo', nickname: 'pedro-novo' });

    expect(updated.name).toBe('Pedro Novo');
    expect(updated.nickname).toBe('pedro-novo');
    expect(updated.email).toBe('pedro@example.com');
  });

  it('should hash a new password when provided', async () => {
    const updated = await sut.execute(1, { password: 'novasenha' });

    expect(updated.password).toBe('hashed:novasenha');
  });

  it('should not re-hash if password is not provided', async () => {
    const original = await userRepo.findById(1);
    const updated = await sut.execute(1, { name: 'Outro Nome' });

    expect(updated.password).toBe(original!.password);
  });

  it('should throw if email is already used by another user', async () => {
    await expect(
      sut.execute(1, { email: 'ana@example.com' })
    ).rejects.toThrow('Email already in use');
  });

  it('should allow updating to same email (no conflict)', async () => {
    const updated = await sut.execute(1, { email: 'pedro@example.com', name: 'Pedro Atualizado' });

    expect(updated.email).toBe('pedro@example.com');
    expect(updated.name).toBe('Pedro Atualizado');
  });

  it('should throw if user does not exist', async () => {
    await expect(sut.execute(999, { name: 'Fantasma' })).rejects.toThrow('User not found');
  });
});
