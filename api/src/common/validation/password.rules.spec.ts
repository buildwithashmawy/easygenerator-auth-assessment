import { isStrongPassword } from './password.rules';

describe('isStrongPassword', () => {
  it.each([
    ['Passw0rd!', true],
    ['a1!aaaaa', true],
    ['short1!', false], // 7 chars
    ['NoNumbers!', false],
    ['NoSpecial1', false],
    ['12345678!', false], // no letter
    ['with space 1', false], // whitespace is not a "special" character
    [`A1!${'a'.repeat(126)}`, false], // > 128 chars
  ])('%s -> %s', (pw, expected) => {
    expect(isStrongPassword(pw)).toBe(expected);
  });
});
