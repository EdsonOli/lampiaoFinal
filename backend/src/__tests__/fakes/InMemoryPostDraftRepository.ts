import { randomUUID } from 'crypto';
import { PostDraft } from '../../core/domain/PostDraft';
import {
  FindPostDraftInput,
  PostDraftRepository,
  SavePostDraftInput,
} from '../../core/ports/PostDraftRepository';

export class InMemoryPostDraftRepository implements PostDraftRepository {
  private drafts: PostDraft[] = [];

  async findByUserDeviceBook(input: FindPostDraftInput): Promise<PostDraft | null> {
    return (
      this.drafts.find(
        draft =>
          draft.userId === input.userId &&
          draft.bookId === input.bookId &&
          draft.deviceId === input.deviceId
      ) ?? null
    );
  }

  async save(input: SavePostDraftInput): Promise<PostDraft> {
    const existingIndex = this.drafts.findIndex(
      draft =>
        draft.userId === input.userId &&
        draft.bookId === input.bookId &&
        draft.deviceId === input.deviceId
    );

    if (existingIndex >= 0) {
      const updatedDraft: PostDraft = {
        ...this.drafts[existingIndex],
        title: input.title,
        text: input.text,
        isItPublic: input.isItPublic,
        updatedAt: new Date(),
      };

      this.drafts[existingIndex] = updatedDraft;
      return updatedDraft;
    }

    const now = new Date();
    const createdDraft: PostDraft = {
      id: randomUUID(),
      userId: input.userId,
      bookId: input.bookId,
      deviceId: input.deviceId,
      title: input.title,
      text: input.text,
      isItPublic: input.isItPublic,
      createdAt: now,
      updatedAt: now,
    };

    this.drafts.push(createdDraft);
    return createdDraft;
  }

  async delete(input: FindPostDraftInput): Promise<void> {
    this.drafts = this.drafts.filter(
      draft =>
        !(
          draft.userId === input.userId &&
          draft.bookId === input.bookId &&
          draft.deviceId === input.deviceId
        )
    );
  }
}