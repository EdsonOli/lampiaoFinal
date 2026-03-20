import { User } from '../../core/domain/User';
import { CreateUserInput, UpdateUserInput, UserRepository } from '../../core/ports/UserRepository';
import { User as UserModel } from '../models/UserModel';

function mapUser(user: UserModel): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    nickname: user.nickname,
    password: user.password,
    img: user.img,
    role: user.role ?? 'user',
  };
}

export class SequelizeUserRepository implements UserRepository {
  async findAll(): Promise<User[]> {
    const users = await UserModel.findAll();
    return users.map(mapUser);
  }

  async create(input: CreateUserInput): Promise<User> {
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      nickname: input.nickname,
      password: input.password,
      img: input.img,
      role: input.role ?? 'user',
    });

    return mapUser(user);
  }

  async update(id: number, input: UpdateUserInput): Promise<User | null> {
    const user = await UserModel.findByPk(id);
    if (!user) {
      return null;
    }

    await user.update({
      name: input.name ?? user.name,
      email: input.email ?? user.email,
      nickname: input.nickname ?? user.nickname,
      password: input.password ?? user.password,
      img: input.img ?? user.img,
    });

    return mapUser(user);
  }

  async delete(id: number): Promise<void> {
    await UserModel.destroy({ where: { id } });
  }

  async findById(id: number): Promise<User | null> {
    const user = await UserModel.findByPk(id);
    return user ? mapUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ where: { email } });
    return user ? mapUser(user) : null;
  }
}
