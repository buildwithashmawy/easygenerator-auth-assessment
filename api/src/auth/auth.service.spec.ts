import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { Session } from './schemas/session.schema';

const userId = new Types.ObjectId().toHexString();
const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: userId,
  email: 'jane@example.com',
  name: 'Jane',
  createdAt: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  const users = { create: jest.fn(), findById: jest.fn(), findByEmailWithPassword: jest.fn() };
  const sessions = {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteMany: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => ({ JWT_ACCESS_TTL_SECONDS: 900, REFRESH_TTL_DAYS: 7 })[key]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: ConfigService, useValue: config },
        { provide: JwtService, useValue: new JwtService({ secret: 'x'.repeat(32) }) },
        { provide: getModelToken(Session.name), useValue: sessions },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('signUp', () => {
    it('hashes the password with argon2id and issues tokens', async () => {
      users.create.mockImplementation(async (data) => makeUser(data));
      const { user, tokens } = await service.signUp({
        email: 'jane@example.com',
        name: 'Jane',
        password: 'Passw0rd!',
      });

      const { passwordHash } = users.create.mock.calls[0][0];
      expect(passwordHash).toMatch(/^\$argon2id\$/);
      expect(await argon2.verify(passwordHash, 'Passw0rd!')).toBe(true);
      expect(user.email).toBe('jane@example.com');
      expect(tokens.accessToken).toEqual(expect.any(String));
      // Only the hash of the refresh token is persisted.
      const stored = sessions.create.mock.calls[0][0];
      expect(stored.tokenHash).not.toEqual(tokens.refreshToken);
      expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('maps a duplicate email to 409 Conflict', async () => {
      users.create.mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 }));
      await expect(
        service.signUp({ email: 'jane@example.com', name: 'Jane', password: 'Passw0rd!' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('signIn', () => {
    it('signs in with correct credentials', async () => {
      const passwordHash = await argon2.hash('Passw0rd!');
      users.findByEmailWithPassword.mockResolvedValue(makeUser({ passwordHash }));
      const result = await service.signIn({ email: 'jane@example.com', password: 'Passw0rd!' });
      expect(result.user.id).toBe(userId);
    });

    it('rejects a wrong password with a generic message', async () => {
      const passwordHash = await argon2.hash('Passw0rd!');
      users.findByEmailWithPassword.mockResolvedValue(makeUser({ passwordHash }));
      await expect(
        service.signIn({ email: 'jane@example.com', password: 'wrong' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
    });

    it('rejects an unknown email with the same generic message', async () => {
      users.findByEmailWithPassword.mockResolvedValue(null);
      await expect(
        service.signIn({ email: 'nobody@example.com', password: 'Passw0rd!' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
      expect(sessions.create).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rotates a valid refresh token within the same family', async () => {
      sessions.findOneAndUpdate.mockResolvedValue({ userId, family: 'fam-1' });
      users.findById.mockResolvedValue(makeUser());
      const { tokens } = await service.refresh('raw-token');
      expect(tokens.refreshToken).not.toBe('raw-token');
      expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({ family: 'fam-1' }));
    });

    it('revokes the whole family when a rotated token is reused', async () => {
      sessions.findOneAndUpdate.mockResolvedValue(null);
      sessions.findOne.mockResolvedValue({
        userId,
        family: 'fam-1',
        rotatedAt: new Date(Date.now() - 60_000),
      });
      await expect(service.refresh('stolen')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sessions.deleteMany).toHaveBeenCalledWith({ family: 'fam-1' });
    });

    it('does not revoke on a concurrent refresh inside the grace window', async () => {
      sessions.findOneAndUpdate.mockResolvedValue(null);
      sessions.findOne.mockResolvedValue({ userId, family: 'fam-1', rotatedAt: new Date() });
      await expect(service.refresh('raced')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sessions.deleteMany).not.toHaveBeenCalled();
    });

    it('rejects when no refresh token is present', async () => {
      await expect(service.refresh(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
