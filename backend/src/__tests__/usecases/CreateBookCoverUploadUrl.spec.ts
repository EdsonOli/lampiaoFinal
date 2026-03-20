import { ForbiddenError, NotFoundError } from '../../core/errors';
import { ImageStorage } from '../../core/ports/ImageStorage';
import { BookRepository } from '../../core/ports/BookRepository';
import { CreateBookCoverUploadUrl } from '../../core/usecases/CreateBookCoverUploadUrl';

class FakeImageStorage implements ImageStorage {
  async createSignedUploadUrl(input: {
    bucket: string;
    path: string;
    mimeType: string;
    expiresInSeconds: number;
  }): Promise<{ uploadUrl: string; publicUrl: string; path: string }> {
    return {
      uploadUrl: `https://upload.example.com/${input.path}`,
      publicUrl: `https://public.example.com/${input.path}`,
      path: input.path,
    };
  }
}

class FakeBookRepository implements BookRepository {
  constructor(private readonly exists: boolean) {}

  async findAll() {
    return [];
  }

  async findById(id: string) {
    if (!this.exists) {
      return null;
    }

    return {
      id,
      name: 'Book',
      isbn: '9780000000000',
      publishingCompany: 'Editora',
      writer: 'Autor',
      genre: 'Drama',
      nPages: 120,
      yearPublication: 2020,
      img: '',
      synopsis: '',
    };
  }

  async create(input: {
    name: string;
    isbn: string;
    publishingCompany: string;
    writer: string;
    genre: string;
    nPages: number;
    yearPublication: number;
    img?: string;
    synopsis?: string;
  }) {
    return {
      id: 'cdd928f6-a68f-4640-964d-55f64ed3b3ec',
      ...input,
    };
  }
}

describe('CreateBookCoverUploadUrl', () => {
  it('creates signed url for draft cover when book id is absent', async () => {
    const sut = new CreateBookCoverUploadUrl(
      new FakeImageStorage(),
      new FakeBookRepository(true),
      'book-covers'
    );

    const result = await sut.execute({
      requesterRole: 'admin',
      requesterUserId: 'e95f5be2-595e-495d-ab2b-6fbb8c4d9bb2',
      fileName: 'capa.jpg',
      mimeType: 'image/jpeg',
    });

    expect(result.path).toContain('books/drafts/e95f5be2-595e-495d-ab2b-6fbb8c4d9bb2/');
  });

  it('throws forbidden for non-admin requester', async () => {
    const sut = new CreateBookCoverUploadUrl(
      new FakeImageStorage(),
      new FakeBookRepository(true),
      'book-covers'
    );

    await expect(
      sut.execute({
        requesterRole: 'user',
        requesterUserId: 'e95f5be2-595e-495d-ab2b-6fbb8c4d9bb2',
        fileName: 'capa.jpg',
        mimeType: 'image/jpeg',
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws not found when book id is informed but does not exist', async () => {
    const sut = new CreateBookCoverUploadUrl(
      new FakeImageStorage(),
      new FakeBookRepository(false),
      'book-covers'
    );

    await expect(
      sut.execute({
        requesterRole: 'admin',
        requesterUserId: 'e95f5be2-595e-495d-ab2b-6fbb8c4d9bb2',
        bookId: 'be5b0af3-53c5-40cd-9db4-d06cd6f15cb0',
        fileName: 'capa.jpg',
        mimeType: 'image/jpeg',
      })
    ).rejects.toThrow(NotFoundError);
  });
});
