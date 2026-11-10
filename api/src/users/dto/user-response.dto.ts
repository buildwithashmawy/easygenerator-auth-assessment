import type { UserDocument } from '../schemas/user.schema';

/** Public representation of a user — the only shape that ever leaves the API. */
export class UserResponseDto {
  /** @example 665f1c2e8b3e4a0012345678 */
  id: string;
  /** @example jane@example.com */
  email: string;
  /** @example Jane Doe */
  name: string;
  createdAt: Date;

  static from(user: UserDocument): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id as string;
    dto.email = user.email;
    dto.name = user.name;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
