import { PostDraft } from '../domain/PostDraft';

export interface SavePostDraftInput {
  userId: string;
  bookId: string;
  deviceId: string;
  title: string;
  text: string;
  isItPublic: boolean;
}

export interface FindPostDraftInput {
  userId: string;
  bookId: string;
  deviceId: string;
}

export interface PostDraftRepository {
  findByUserDeviceBook(input: FindPostDraftInput): Promise<PostDraft | null>;
  save(input: SavePostDraftInput): Promise<PostDraft>;
  delete(input: FindPostDraftInput): Promise<void>;
}