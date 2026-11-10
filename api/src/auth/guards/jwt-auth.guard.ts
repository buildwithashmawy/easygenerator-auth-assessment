import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ACCESS_TOKEN_COOKIE, AccessTokenPayload } from '../auth.constants';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator';

/**
 * Accepts the access token from the httpOnly cookie (browser) or a Bearer header
 * (API clients, Swagger UI). Stateless: no DB hit per request.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Authentication required');

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      req.user = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('Session expired or invalid');
    }
  }

  private extractToken(req: Request): string | undefined {
    const fromCookie = (req.cookies as Record<string, string> | undefined)?.[ACCESS_TOKEN_COOKIE];
    if (fromCookie) return fromCookie;
    const [type, value] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? value : undefined;
  }
}
