import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../common/validation/is-strong-password.decorator';
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '../../common/validation/password.rules';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const normaliseEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class SignUpDto {
  /** @example jane@example.com */
  @Transform(normaliseEmail)
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(254)
  email: string;

  /** @example Jane Doe */
  @Transform(trim)
  @IsString()
  @MinLength(NAME_MIN_LENGTH, { message: `Name must be at least ${NAME_MIN_LENGTH} characters` })
  @MaxLength(NAME_MAX_LENGTH, { message: `Name must be at most ${NAME_MAX_LENGTH} characters` })
  name: string;

  /**
   * Min 8 chars, at least one letter, one number and one special character.
   * @example Str0ng!Pass
   */
  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH)
  @IsStrongPassword()
  password: string;
}
