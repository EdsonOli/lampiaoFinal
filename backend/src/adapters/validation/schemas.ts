import { z } from 'zod';

const currentYear = new Date().getFullYear();
const passwordSchema = z.string()
  .min(10, 'Password must be at least 10 characters')
  .max(128)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one symbol');

const optionalTrimmedString = (min = 1, max = 255) =>
  z.preprocess(
    value => (typeof value === 'string' ? value.trim() : value),
    z.string().min(min).max(max).optional()
  );

const optionalTrimmedStringAllowEmpty = (max = 255) =>
  z.preprocess(
    value => (typeof value === 'string' ? value.trim() : value),
    z.string().max(max).optional()
  );

const requiredTrimmedString = (min = 1, max = 255) =>
  z.preprocess(
    value => (typeof value === 'string' ? value.trim() : value),
    z.string().min(min).max(max)
  );

const MAX_STORY_WORDS = 40000;
const MAX_STORY_TEXT_CHARS = 260000;
const STORY_TEXT_REQUIRED_MESSAGE = 'Texto da publicacao e obrigatorio';
const STORY_TEXT_EMPTY_MESSAGE = 'Texto da publicacao nao pode ficar vazio';
const STORY_TEXT_MAX_CHARS_MESSAGE = `Texto da publicacao deve ter no maximo ${MAX_STORY_TEXT_CHARS} caracteres`;
const STORY_TEXT_MAX_WORDS_MESSAGE = `Texto da publicacao deve ter no maximo ${MAX_STORY_WORDS.toLocaleString('pt-BR')} palavras`;

const countWords = (value: string): number =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;

const requiredStoryTextSchema = z.preprocess(
  value => (typeof value === 'string' ? value.trim() : value),
  z
    .string({ required_error: STORY_TEXT_REQUIRED_MESSAGE })
    .min(1, STORY_TEXT_EMPTY_MESSAGE)
    .max(MAX_STORY_TEXT_CHARS, STORY_TEXT_MAX_CHARS_MESSAGE)
    .refine(text => countWords(text) <= MAX_STORY_WORDS, {
      message: STORY_TEXT_MAX_WORDS_MESSAGE,
    })
);

const optionalStoryTextSchema = z.preprocess(
  value => (typeof value === 'string' ? value.trim() : value),
  z
    .string()
    .min(1, STORY_TEXT_EMPTY_MESSAGE)
    .max(MAX_STORY_TEXT_CHARS, STORY_TEXT_MAX_CHARS_MESSAGE)
    .refine(text => countWords(text) <= MAX_STORY_WORDS, {
      message: STORY_TEXT_MAX_WORDS_MESSAGE,
    })
    .optional()
);

export const registerSchema = z.object({
  name: requiredTrimmedString(2, 120),
  email: z.preprocess(
    value => (typeof value === 'string' ? value.trim().toLowerCase() : value),
    z.string().email().max(160)
  ),
  nickname: requiredTrimmedString(2, 80),
  password: passwordSchema,
  confirmPassword: z.string().min(1).max(128),
  img: optionalTrimmedString(1, 2048),
}).refine(payload => payload.password === payload.confirmPassword, {
  message: 'Password confirmation does not match',
  path: ['confirmPassword'],
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(20),
});

export const profileImageUploadSchema = z.object({
  fileName: requiredTrimmedString(1, 120),
  mimeType: z.string().min(5).max(120),
});

export const bookCoverUploadSchema = z.object({
  bookId: z.string().uuid().optional(),
  fileName: requiredTrimmedString(1, 120),
  mimeType: z.string().min(5).max(120),
});

export const loginSchema = z.object({
  email: z.preprocess(
    value => (typeof value === 'string' ? value.trim().toLowerCase() : value),
    z.string().email().max(160)
  ),
  password: z.string().min(1).max(128),
});

export const createBookSchema = z.object({
  name: requiredTrimmedString(1, 255),
  isbn: requiredTrimmedString(10, 20),
  publishingCompany: requiredTrimmedString(1, 255),
  writer: requiredTrimmedString(1, 255),
  genre: z.union([
    requiredTrimmedString(1, 500),
    z.array(requiredTrimmedString(1, 100)).min(1).max(10),
  ]),
  nPages: z.coerce.number().int().positive().max(50000),
  yearPublication: z.coerce.number().int().min(1000).max(currentYear + 1),
  img: optionalTrimmedString(1, 2048),
  synopsis: optionalTrimmedString(1, 5000),
});

export const updateBookSchema = z.object({
  name: optionalTrimmedString(1, 255),
  isbn: optionalTrimmedString(10, 20),
  publishingCompany: optionalTrimmedString(1, 255),
  writer: optionalTrimmedString(1, 255),
  genre: z.union([
    optionalTrimmedString(1, 500),
    z.array(requiredTrimmedString(1, 100)).min(1).max(10),
  ]).optional(),
  nPages: z.coerce.number().int().positive().max(50000).optional(),
  yearPublication: z.coerce.number().int().min(1000).max(currentYear + 1).optional(),
  img: optionalTrimmedString(1, 2048),
  synopsis: optionalTrimmedString(1, 5000),
}).refine(payload => Object.values(payload).some(value => value !== undefined), {
  message: 'At least one field must be provided',
});

export const createPostSchema = z.object({
  title: requiredTrimmedString(1, 160),
  text: requiredStoryTextSchema,
  bookId: z.string().uuid(),
  isItPublic: z.boolean().optional(),
});

export const updatePostSchema = z.object({
  title: optionalTrimmedString(1, 160),
  text: optionalStoryTextSchema,
  isItPublic: z.boolean().optional(),
}).refine(payload => payload.title !== undefined || payload.text !== undefined || payload.isItPublic !== undefined, {
  message: 'At least one field must be provided',
});

export const getPostDraftQuerySchema = z.object({
  deviceId: requiredTrimmedString(3, 120),
});

export const savePostDraftSchema = z.object({
  deviceId: requiredTrimmedString(3, 120),
  title: optionalTrimmedStringAllowEmpty(160),
  isItPublic: z.boolean().optional(),
  text: z.preprocess(
    value => (typeof value === 'string' ? value.trim() : value),
    z
      .string()
      .max(MAX_STORY_TEXT_CHARS, STORY_TEXT_MAX_CHARS_MESSAGE)
      .refine(text => countWords(text) <= MAX_STORY_WORDS, {
        message: STORY_TEXT_MAX_WORDS_MESSAGE,
      })
      .optional()
  ),
}).refine(payload => payload.title !== undefined || payload.text !== undefined || payload.isItPublic !== undefined, {
  message: 'Informe titulo, texto ou visibilidade para salvar o rascunho',
});

export const createCommentSchema = z.object({
  title: requiredTrimmedString(1, 160),
  text: requiredTrimmedString(1, 3000),
  postId: z.string().uuid(),
  parentCommentId: z.string().uuid().optional(),
});

export const updateCommentSchema = z.object({
  title: optionalTrimmedString(1, 160),
  text: optionalTrimmedString(1, 3000),
}).refine(payload => payload.title !== undefined || payload.text !== undefined, {
  message: 'At least one field must be provided',
});

export const voteCommentRelevanceSchema = z.object({
  value: z.enum(['relevant', 'less_relevant']),
});

const notebookStatusSchema = z.enum(['Lido', 'Lendo', 'Quero ler']);

export const createNotebookSchema = z.object({
  bookId: z.string().uuid(),
  grade: z.coerce.number().int().min(0).max(5).optional(),
  status: notebookStatusSchema,
  favorite: z.boolean().optional(),
});

export const updateNotebookSchema = z.object({
  grade: z.coerce.number().int().min(0).max(5).optional(),
  status: notebookStatusSchema.optional(),
  favorite: z.boolean().optional(),
}).refine(payload => payload.grade !== undefined || payload.status !== undefined || payload.favorite !== undefined, {
  message: 'At least one field must be provided',
});

export const updateMeSchema = z.object({
  name: optionalTrimmedString(2, 120),
  email: z.preprocess(
    value => (typeof value === 'string' ? value.trim().toLowerCase() : value),
    z.string().email().max(160).optional()
  ),
  nickname: optionalTrimmedString(2, 80),
  password: passwordSchema.optional(),
  img: optionalTrimmedString(1, 2048),
}).refine(payload => Object.values(payload).some(value => value !== undefined), {
  message: 'At least one field must be provided',
});