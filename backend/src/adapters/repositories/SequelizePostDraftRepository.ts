import { PostDraft } from '../../core/domain/PostDraft';
import {
  FindPostDraftInput,
  PostDraftRepository,
  SavePostDraftInput,
} from '../../core/ports/PostDraftRepository';
import { PostDraft as PostDraftModel } from '../models/PostDraftModel';

function mapPostDraft(draft: PostDraftModel): PostDraft {
  return {
    id: draft.id,
    userId: draft.user_id,
    bookId: draft.book_id,
    deviceId: draft.device_id,
    title: draft.title,
    text: draft.text,
    isItPublic: draft.is_it_public,
    createdAt: (draft as unknown as { createdAt?: Date }).createdAt,
    updatedAt: (draft as unknown as { updatedAt?: Date }).updatedAt,
  };
}

export class SequelizePostDraftRepository implements PostDraftRepository {
  async findByUserDeviceBook(input: FindPostDraftInput): Promise<PostDraft | null> {
    const draft = await PostDraftModel.findOne({
      where: {
        user_id: input.userId,
        book_id: input.bookId,
        device_id: input.deviceId,
      },
    });

    return draft ? mapPostDraft(draft) : null;
  }

  async save(input: SavePostDraftInput): Promise<PostDraft> {
    const [draft, created] = await PostDraftModel.findOrCreate({
      where: {
        user_id: input.userId,
        book_id: input.bookId,
        device_id: input.deviceId,
      },
      defaults: {
        user_id: input.userId,
        book_id: input.bookId,
        device_id: input.deviceId,
        title: input.title,
        text: input.text,
        is_it_public: input.isItPublic,
      },
    });

    if (!created) {
      await draft.update({
        title: input.title,
        text: input.text,
        is_it_public: input.isItPublic,
      });
    }

    return mapPostDraft(draft);
  }

  async delete(input: FindPostDraftInput): Promise<void> {
    await PostDraftModel.destroy({
      where: {
        user_id: input.userId,
        book_id: input.bookId,
        device_id: input.deviceId,
      },
    });
  }
}