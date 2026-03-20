import { CreateUser } from '../../core/usecases/CreateUser';
import { DeleteUser } from '../../core/usecases/DeleteUser';
import { FakePasswordHasher } from '../fakes/FakePasswordHasher';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';

describe('DeleteUser', () => {
  let userRepo: InMemoryUserRepository;
  let sut: DeleteUser;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    sut = new DeleteUser(userRepo);

    const createUser = new CreateUser(userRepo, new FakePasswordHasher());
    await createUser.execute({
      name: 'Carlos Mota',
      email: 'carlos@example.com',
      nickname: 'carlos',
      password: 'senha123',
    });
  });

  it('should delete an existing user', async () => {
    await sut.execute(1);

    const user = await userRepo.findById(1);
    expect(user).toBeNull();
  });

  it('should throw if user does not exist', async () => {
    await expect(sut.execute(999)).rejects.toThrow('User not found');
  });

  it('should not affect other users', async () => {
    const createUser = new CreateUser(userRepo, new FakePasswordHasher());
    await createUser.execute({
      name: 'Outro Usuario',
      email: 'outro@example.com',
      nickname: 'outro',
      password: '123',
    });

    await sut.execute(1);

    const remaining = await userRepo.findAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(2);
  });
});
