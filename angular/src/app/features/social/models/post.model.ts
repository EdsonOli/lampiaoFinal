/**
 * Modelos para o domínio de Social (Posts, Comentários, Timeline)
 */

export interface PostDto {
  id: string;
  title: string;
  content: string;
  bookId?: string;
  userId: string;
  isPublic: boolean;
  likesCount: number;
  commentsCount: number;
  creationTime: Date;
  lastModificationTime?: Date;
  
  // Navigation properties
  book?: {
    id: string;
    name: string;
    author?: string;
    imageUrl?: string;
  };
  user?: {
    id: string;
    userName: string;
    name?: string;
    profileImageUrl?: string;
  };
  
  // UI state
  isLikedByCurrentUser?: boolean;
}

export interface CreatePostDto {
  title: string;
  content: string;
  bookId?: string;
  isPublic: boolean;
}

export interface UpdatePostDto {
  title: string;
  content: string;
  isPublic: boolean;
}

export interface GetPostsInput {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  bookId?: string;
  userId?: string;
  isPublic?: boolean;
}

export interface CommentDto {
  id: string;
  content: string;
  postId: string;
  userId: string;
  parentCommentId?: string;
  creationTime: Date;
  lastModificationTime?: Date;
  
  // Navigation properties
  user?: {
    id: string;
    userName: string;
    name?: string;
    profileImageUrl?: string;
  };
  
  // For nested comments
  replies?: CommentDto[];
}

export interface CreateCommentDto {
  content: string;
  postId: string;
  parentCommentId?: string;
}

export interface UpdateCommentDto {
  content: string;
}

export interface GetCommentsInput {
  skipCount?: number;
  maxResultCount?: number;
  postId: string;
}
