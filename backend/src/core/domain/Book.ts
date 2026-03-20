
export interface Book {
  id: number;
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
