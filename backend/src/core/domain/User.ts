export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  nickname: string;
  password: string;
  img?: string;
  role: UserRole;
}
