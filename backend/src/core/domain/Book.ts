
export interface Book {
  id: string;
  name: string;
  isbn: string;
  publishingCompany: string;
  writer: string;
  genre: string;
  nPages: number;
  yearPublication: number;
  img?: string;
  synopsis?: string;
}
