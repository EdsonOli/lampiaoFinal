export interface Post {
  id: string;
  title: string;
  text: string;
  isItPublic: boolean;
  userId: string;
  bookId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
