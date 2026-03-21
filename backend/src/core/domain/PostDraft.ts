export interface PostDraft {
  id: string;
  userId: string;
  bookId: string;
  deviceId: string;
  title: string;
  text: string;
  isItPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}