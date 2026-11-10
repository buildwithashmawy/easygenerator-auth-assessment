import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  user: UserResponseDto;
  /** When the access token expires (ISO 8601). Lets the client refresh proactively. */
  accessTokenExpiresAt: string;
}
