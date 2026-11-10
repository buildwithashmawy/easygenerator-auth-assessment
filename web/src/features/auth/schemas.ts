import { z } from 'zod';

/** Mirrors api/src/common/validation/password.rules.ts — the API remains the authority. */
export const passwordRules = [
  { id: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { id: 'letter', label: 'One letter', test: (v: string) => /[A-Za-z]/.test(v) },
  { id: 'number', label: 'One number', test: (v: string) => /\d/.test(v) },
  { id: 'special', label: 'One special character', test: (v: string) => /[^A-Za-z0-9\s]/.test(v) },
] as const;

const email = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .pipe(z.email('Enter a valid email address, like name@example.com'));

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be at most 50 characters'),
  email,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must be at most 128 characters')
    .refine((v) => passwordRules.every((r) => r.test(v)), 'Password doesn’t meet all requirements yet'),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;

/** 0–4 score used by the strength meter: one point per satisfied rule, bonus for length. */
export function passwordScore(value: string): number {
  if (!value) return 0;
  const passed = passwordRules.filter((r) => r.test(value)).length;
  if (passed < passwordRules.length) return Math.min(passed, 2);
  return value.length >= 14 ? 4 : value.length >= 11 ? 3 : 2.5;
}
