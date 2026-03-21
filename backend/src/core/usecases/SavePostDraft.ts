import { NotFoundError } from '../errors';
import { PostDraft } from '../domain/PostDraft';
import { BookRepository } from '../ports/BookRepository';
import { PostDraftRepository } from '../ports/PostDraftRepository';

export interface SavePostDraftInput {
  userId: string;
  bookId: string;
  deviceId: string;
  title?: string;
  text?: string;
  isItPublic?: boolean;
}

export class SavePostDraft {
  constructor(
    private readonly postDraftRepository: PostDraftRepository,
    private readonly bookRepository: BookRepository
  ) {}

  async execute(input: SavePostDraftInput): Promise<PostDraft> {
    const book = await this.bookRepository.findById(input.bookId);
    if (!book) {
      throw new NotFoundError('Book not found');
    }

    const existingDraft = await this.postDraftRepository.findByUserDeviceBook({
      userId: input.userId,
      bookId: input.bookId,
      deviceId: input.deviceId,
    });

    return this.postDraftRepository.save({
      userId: input.userId,
      bookId: input.bookId,
      deviceId: input.deviceId,
      title: input.title ?? existingDraft?.title ?? '',
      text: input.text ?? existingDraft?.text ?? '',
      isItPublic: typeof input.isItPublic === 'boolean' ? input.isItPublic : (existingDraft?.isItPublic ?? true),
    });
  }
}