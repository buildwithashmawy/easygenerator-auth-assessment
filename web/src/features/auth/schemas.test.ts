import { passwordScore, signInSchema, signUpSchema } from './schemas';

describe('signUpSchema', () => {
  const valid = { name: 'Jane', email: 'jane@example.com', password: 'Passw0rd!' };

  it('accepts a valid payload', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['name', 'Jo'],
    ['email', 'jane@'],
    ['password', 'Password1'],
    ['password', 'Pa1!'],
  ])('rejects invalid %s (%s)', (field, value) => {
    const result = signUpSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual([field]);
  });

  it('trims the name before checking its length', () => {
    expect(signUpSchema.safeParse({ ...valid, name: '  Jo  ' }).success).toBe(false);
  });
});

describe('signInSchema', () => {
  it('requires both fields', () => {
    expect(signInSchema.safeParse({ email: '', password: '' }).success).toBe(false);
  });
});

describe('passwordScore', () => {
  it('caps the score until every rule passes', () => {
    expect(passwordScore('')).toBe(0);
    expect(passwordScore('abcdefghijk')).toBeLessThanOrEqual(2);
    expect(passwordScore('Passw0rd!')).toBe(2.5);
    expect(passwordScore('Correct-Horse-9')).toBe(4);
  });
});
