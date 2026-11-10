import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Model, Types } from 'mongoose';
import type { Env } from '../config/env.validation';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AccessTokenPayload, REFRESH_REUSE_GRACE_MS } from './auth.constants';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { Session } from './schemas/session.schema';

export interface IssuedTokens {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface AuthResult {
  user: UserDocument;
  tokens: IssuedTokens;
}

export interface ClientMeta {
  userAgent?: string;
}

const INVALID_CREDENTIALS = 'Invalid email or password';
const MONGO_DUPLICATE_KEY = 11000;

/** OWASP-recommended argon2id parameters (19 MiB, t=2, p=1). */
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /** Verified against when the email is unknown, so response time does not reveal which emails exist. */
  private readonly dummyHash: Promise<string>;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    @InjectModel(Session.name) private readonly sessions: Model<Session>,
  ) {
    this.dummyHash = argon2.hash(randomBytes(32).toString('hex'), ARGON2_OPTIONS);
  }

  async signUp(dto: SignUpDto, meta: ClientMeta = {}): Promise<AuthResult> {
    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);
    let user: UserDocument;
    try {
      user = await this.users.create({ email: dto.email, name: dto.name, passwordHash });
    } catch (err) {
      if ((err as { code?: number }).code === MONGO_DUPLICATE_KEY) {
        throw new ConflictException('An account with this email already exists');
      }
      throw err;
    }
    this.logger.log({ userId: user.id }, 'User signed up');
    return { user, tokens: await this.issueTokens(user, randomUUID(), meta) };
  }

  async signIn(dto: SignInDto, meta: ClientMeta = {}): Promise<AuthResult> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    const hash = user?.passwordHash ?? (await this.dummyHash);
    const valid = await argon2.verify(hash, dto.password).catch(() => false);

    if (!user || !valid) {
      this.logger.warn({ email: dto.email }, 'Failed sign-in attempt');
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    this.logger.log({ userId: user.id }, 'User signed in');
    return { user, tokens: await this.issueTokens(user, randomUUID(), meta) };
  }

  /**
   * Refresh-token rotation with reuse detection: every refresh token is single-use.
   * Presenting one that was already rotated (outside a short grace window for concurrent
   * tabs) means it was probably stolen, so the whole session family is revoked.
   */
  async refresh(rawToken: string | undefined, meta: ClientMeta = {}): Promise<AuthResult> {
    if (!rawToken) throw new UnauthorizedException('Session expired');
    const tokenHash = hashToken(rawToken);
    const now = new Date();

    const session = await this.sessions.findOneAndUpdate(
      { tokenHash, rotatedAt: null, expiresAt: { $gt: now } },
      { $set: { rotatedAt: now } },
    );

    if (!session) {
      const stale = await this.sessions.findOne({ tokenHash });
      if (stale?.rotatedAt && now.getTime() - stale.rotatedAt.getTime() > REFRESH_REUSE_GRACE_MS) {
        await this.sessions.deleteMany({ family: stale.family });
        this.logger.warn({ userId: String(stale.userId) }, 'Refresh token reuse detected — session family revoked');
      }
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.users.findById(String(session.userId));
    if (!user) {
      await this.sessions.deleteMany({ family: session.family });
      throw new UnauthorizedException('Session expired');
    }
    return { user, tokens: await this.issueTokens(user, session.family, meta) };
  }

  async signOut(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const session = await this.sessions.findOne({ tokenHash: hashToken(rawToken) });
    if (session) await this.sessions.deleteMany({ family: session.family });
  }

  private async issueTokens(
    user: UserDocument,
    family: string,
    meta: ClientMeta,
  ): Promise<IssuedTokens> {
    const accessTtl = this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true });
    const refreshTtlDays = this.config.get('REFRESH_TTL_DAYS', { infer: true });

    const payload: AccessTokenPayload = { sub: user.id as string, email: user.email };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: accessTtl });
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTtlDays * 86_400_000);

    await this.sessions.create({
      userId: new Types.ObjectId(user.id as string),
      tokenHash: hashToken(refreshToken),
      family,
      expiresAt: refreshTokenExpiresAt,
      userAgent: meta.userAgent?.slice(0, 256),
    });

    return {
      accessToken,
      accessTokenExpiresAt: new Date(Date.now() + accessTtl * 1000),
      refreshToken,
      refreshTokenExpiresAt,
    };
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
