/**
 * Single source of truth for credential rules. The web app mirrors these rules
 * (web/src/lib/validation.ts) so users get instant feedback, but the API is the authority.
 */
export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 8;
/** argon2 has no practical input limit, but unbounded input is a DoS vector. */
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_HAS_LETTER = /[A-Za-z]/;
export const PASSWORD_HAS_NUMBER = /\d/;
export const PASSWORD_HAS_SPECIAL = /[^A-Za-z0-9\s]/;

export const PASSWORD_RULES_MESSAGE =
  'Password must be at least 8 characters and contain at least one letter, one number and one special character';

export function isStrongPassword(value: string): boolean {
  return (
    value.length >= PASSWORD_MIN_LENGTH &&
    value.length <= PASSWORD_MAX_LENGTH &&
    PASSWORD_HAS_LETTER.test(value) &&
    PASSWORD_HAS_NUMBER.test(value) &&
    PASSWORD_HAS_SPECIAL.test(value)
  );
}
