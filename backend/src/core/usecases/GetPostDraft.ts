import { PostDraft } from '../domain/PostDraft';
import { PostDraftRepository } from '../ports/PostDraftRepository';

export interface GetPostDraftInput {
  userId: string;
  bookId: string;
  deviceId: string;
}

export class GetPostDraft {
  constructor(private readonly postDraftRepository: PostDraftRepository) {}

  async execute(input: GetPostDraftInput): Promise<PostDraft | null> {
    return this.postDraftRepository.findByUserDeviceBook({
      userId: input.userId,
      bookId: input.bookId,
      deviceId: input.deviceId,
    });
  }
}