import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '../../common/validation/password.rules';

export class SignInDto {
  /** @example jane@example.com */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(254)
  email: string;

  /**
   * Strength rules are deliberately NOT re-checked on sign-in: doing so leaks the policy
   * and would lock out users if the policy ever tightens.
   * @example Str0ng!Pass
   */
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}
