import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SignUpDto } from './sign-up.dto';

const errorsFor = (input: Record<string, unknown>) =>
  validateSync(plainToInstance(SignUpDto, input)).map((e) => e.property);

describe('SignUpDto', () => {
  const valid = { email: 'Jane@Example.com ', name: ' Jane ', password: 'Passw0rd!' };

  it('accepts a valid payload and normalises email/name', () => {
    const dto = plainToInstance(SignUpDto, valid);
    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.email).toBe('jane@example.com');
    expect(dto.name).toBe('Jane');
  });

  it('rejects an invalid email', () => {
    expect(errorsFor({ ...valid, email: 'not-an-email' })).toEqual(['email']);
  });

  it('rejects a name shorter than 3 characters (after trimming)', () => {
    expect(errorsFor({ ...valid, name: '  Jo  ' })).toEqual(['name']);
  });

  it.each(['short1!', 'NoNumber!', 'NoSpecial1', '12345678!'])('rejects weak password %s', (pw) => {
    expect(errorsFor({ ...valid, password: pw })).toEqual(['password']);
  });
});
