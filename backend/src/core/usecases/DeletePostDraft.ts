import { PostDraftRepository } from '../ports/PostDraftRepository';

export interface DeletePostDraftInput {
  userId: string;
  bookId: string;
  deviceId: string;
}

export class DeletePostDraft {
  constructor(private readonly postDraftRepository: PostDraftRepository) {}

  async execute(input: DeletePostDraftInput): Promise<void> {
    await this.postDraftRepository.delete({
      userId: input.userId,
      bookId: input.bookId,
      deviceId: input.deviceId,
    });
  }
}