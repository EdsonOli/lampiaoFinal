import { User } from '../../core/domain/User';

export interface PublicUserDTO {
  id: string;
  name: string;
  email: string;
  nickname: string;
  img?: string;
}

export interface AdminUserDTO extends PublicUserDTO {
  role: User['role'];
}

export function toPublicUserDTO(user: User): PublicUserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    nickname: user.nickname,
    img: user.img,
  };
}

export function toAdminUserDTO(user: User): AdminUserDTO {
  return {
    ...toPublicUserDTO(user),
    role: user.role,
  };
}
