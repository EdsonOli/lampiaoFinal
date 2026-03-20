export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  nickname: string;
  password: string;
  img?: string;
  role: UserRole;
}
