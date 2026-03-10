/**
 * Modelos para o domínio de Profile (Perfil de Usuário)
 */

export interface UserProfileDto {
  id: string;
  userId: string;
  profileImageUrl?: string;
  bio?: string;
  favoriteGenres?: string[];
  creationTime: Date;
  
  // User info
  userName: string;
  name?: string;
  surname?: string;
  email: string;
}

export interface UpdateUserProfileDto {
  profileImageUrl?: string;
  bio?: string;
  favoriteGenres?: string[];
}

export interface UserStatisticsDto {
  totalBooksRead: number;
  totalPosts: number;
  totalComments: number;
  totalFavorites: number;
  averageRating: number;
  memberSince: Date;
  lastActivity?: Date;
}
