export interface Post {
  id: string;
  title: string;
  text: string;
  isItPublic: boolean;
  userId: string;
  bookId: string;
  createdAt?: string;
}

export interface CreatePostInput {
  title: string;
  text: string;
  bookId: string;
  isItPublic?: boolean;
}

export interface UpdatePostInput {
  title?: string;
  text?: string;
  isItPublic?: boolean;
}

export interface PostDraftPayload {
  id: string;
  userId: string;
  bookId: string;
  deviceId: string;
  title: string;
  text: string;
  isItPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Book {
  id: string;
  name: string;
  writer: string;
  genre: string;
  nPages: number;
  yearPublication: number;
  isbn: string;
  publishingCompany: string;
  img?: string;
  synopsis?: string;
}

export interface BookSeriesContext {
  id: string;
  name: string;
  universeName?: string;
  metadataSource: string;
  metadataConfidence: 'low' | 'medium' | 'high';
  positionInSeries?: number;
  positionLabel?: string;
}

export interface CreateBookFromSearchInput extends Omit<Book, 'id'> {
  series?: {
    name: string;
    universeName?: string;
    positionInSeries?: number;
    positionLabel?: string;
    metadataSource?: string;
    metadataConfidence?: 'low' | 'medium' | 'high';
  };
}

export interface SeriesNarrativePost {
  id: string;
  title: string;
  text: string;
  isItPublic: boolean;
  userId: string;
  bookId: string;
  createdAt?: string;
  bookName: string;
  positionInSeries?: number;
  positionLabel?: string;
}

export interface Notebook {
  id: string;
  userId: string;
  bookId: string;
  grade?: number;
  status: 'Lido' | 'Lendo' | 'Quero ler';
  favorite: boolean;
}

export interface CreateNotebookInput {
  bookId: string;
  grade?: number;
  status: Notebook['status'];
  favorite?: boolean;
}

export interface UpdateNotebookInput {
  grade?: number;
  status?: Notebook['status'];
  favorite?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  nickname: string;
  img?: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  nickname?: string;
  password?: string;
  img?: string;
}

export interface SignedUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  path: string;
}
