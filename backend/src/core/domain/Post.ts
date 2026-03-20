export interface Post {
  id: number;
  title: string;
  text: string;
  isItPublic: boolean;
  userId: number;
  bookId: number;
  createdAt?: Date;
  updatedAt?: Date;
}
