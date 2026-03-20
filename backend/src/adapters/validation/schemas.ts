import { z } from 'zod';

const currentYear = new Date().getFullYear();
const passwordSchema = z.string()
  .min(10, 'Password must be at least 10 characters')
  .max(128)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const optionalTrimmedString = (min = 1, max = 255) =>
  z.preprocess(
    value => (typeof value === 'string' ? value.trim() : value),
    z.string().min(min).max(max).optional()
  );

const requiredTrimmedString = (min = 1, max = 255) =>
  z.preprocess(
    value => (typeof value === 'string' ? value.trim() : value),
    z.string().min(min).max(max)
  );

export const registerSchema = z.object({
  name: requiredTrimmedString(2, 120),
  email: z.preprocess(
    value => (typeof value === 'string' ? value.trim().toLowerCase() : value),
    z.string().email().max(160)
  ),
  nickname: requiredTrimmedString(2, 80),
  password: passwordSchema,
  img: optionalTrimmedString(1, 2048),
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

export const createPostSchema = z.object({
  title: requiredTrimmedString(1, 160),
  text: requiredTrimmedString(1, 5000),
  bookId: z.coerce.number().int().positive(),
  isItPublic: z.boolean().optional(),
});

export const updatePostSchema = z.object({
  title: optionalTrimmedString(1, 160),
  text: optionalTrimmedString(1, 5000),
  isItPublic: z.boolean().optional(),
}).refine(payload => payload.title !== undefined || payload.text !== undefined || payload.isItPublic !== undefined, {
  message: 'At least one field must be provided',
});

export const createCommentSchema = z.object({
  title: requiredTrimmedString(1, 160),
  text: requiredTrimmedString(1, 3000),
  postId: z.coerce.number().int().positive(),
});

export const updateCommentSchema = z.object({
  title: optionalTrimmedString(1, 160),
  text: optionalTrimmedString(1, 3000),
}).refine(payload => payload.title !== undefined || payload.text !== undefined, {
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