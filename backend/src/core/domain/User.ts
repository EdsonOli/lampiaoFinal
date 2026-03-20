export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  nickname: string;
  password?: string;
  img?: string;
  authProvider?: 'local' | 'google';
  providerId?: string;
  emailVerified?: boolean;
  role: UserRole;
}
