import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { Env } from '../config/env.validation';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { REFRESH_TOKEN_COOKIE } from './auth.constants';
import { clearAuthCookies, setAuthCookies } from './auth.cookies';
import { AuthResult, AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

/** Stricter limit on credential endpoints to slow down brute force and credential stuffing. */
const CREDENTIALS_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
@Controller('auth')
export class AuthController {
  private readonly secureCookies: boolean;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService<Env, true>,
  ) {
    this.secureCookies = config.get('NODE_ENV', { infer: true }) === 'production';
  }

  @Post('signup')
  @Throttle(CREDENTIALS_THROTTLE)
  @ApiCreatedResponse({ type: AuthResponseDto, description: 'Account created and signed in' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async signUp(
    @Body() dto: SignUpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.respond(res, await this.auth.signUp(dto, meta(req)));
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @Throttle(CREDENTIALS_THROTTLE)
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async signIn(
    @Body() dto: SignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.respond(res, await this.auth.signIn(dto, meta(req)));
  }

  /** Exchanges the refresh cookie for a fresh access + refresh token pair (rotation). */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing, expired or revoked refresh token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      return this.respond(res, await this.auth.refresh(refreshCookie(req), meta(req)));
    } catch (err) {
      clearAuthCookies(res, this.secureCookies);
      throw err;
    }
  }

  @Post('signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Session revoked and cookies cleared' })
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.signOut(refreshCookie(req));
    clearAuthCookies(res, this.secureCookies);
  }

  private respond(res: Response, { user, tokens }: AuthResult): AuthResponseDto {
    setAuthCookies(res, tokens, this.secureCookies);
    return {
      user: UserResponseDto.from(user),
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
    };
  }
}

function refreshCookie(req: Request): string | undefined {
  return (req.cookies as Record<string, string> | undefined)?.[REFRESH_TOKEN_COOKIE];
}

function meta(req: Request) {
  return { userAgent: req.get('user-agent') };
}
