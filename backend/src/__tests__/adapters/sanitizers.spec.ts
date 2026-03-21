import { sanitizeBookImageUrl, sanitizeProfileImageUrl } from '../../adapters/validation/sanitizers';

describe('sanitizeBookImageUrl', () => {
  it('accepts trusted Google Books cover URL without file extension', () => {
    const url = 'http://books.google.com/books/content?id=QvpDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api';

    const result = sanitizeBookImageUrl(url);

    expect(result).toContain('books.google.com/books/content');
    expect(result).toContain('&printsec=frontcover&img=1&zoom=1');
    expect(result).not.toContain('&amp;');
  });

  it('rejects untrusted host even when protocol is valid', () => {
    const url = 'https://evil.example.com/cover.jpg';

    expect(() => sanitizeBookImageUrl(url)).toThrow('Invalid image URL');
  });

  it('accepts profile image URL without file extension', () => {
    const url = 'https://lh3.googleusercontent.com/a/ACg8ocJJKLue-o7WbEOWhfn-rrys9W8KUkaXM42cLwP6w_yBsJXOblv27w=s96-c';

    const result = sanitizeProfileImageUrl(url);

    expect(result).toBe(url);
  });
});
