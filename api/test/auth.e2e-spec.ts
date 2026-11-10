/**
 * End-to-end tests against a real MongoDB. Requires MONGODB_URI (CI provides a mongo
 * service container). A unique database is used per run and dropped afterwards.
 */
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import type { Connection } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

const baseUri = process.env.MONGODB_URI;
const describeIfDb = baseUri ? describe : describe.skip;

describeIfDb('Auth (e2e)', () => {
  let app: INestApplication;
  const user = { email: `e2e-${Date.now()}@example.com`, name: 'E2E User', password: 'Passw0rd!' };

  beforeAll(async () => {
    const url = new URL(baseUri!);
    url.pathname = `/easygen-auth-e2e-${Date.now()}`;
    process.env.MONGODB_URI = url.toString();
    process.env.JWT_ACCESS_SECRET ??= 'e2e-secret-e2e-secret-e2e-secret-e2e';
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.get<Connection>(getConnectionToken()).dropDatabase();
    await app?.close();
  });

  const cookiesOf = (res: request.Response): string[] =>
    ([] as string[]).concat(res.headers['set-cookie'] ?? []);

  it('GET /api/users/me is protected', () =>
    request(app.getHttpServer()).get('/api/users/me').expect(401));

  it('rejects an invalid sign-up payload with field errors', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: 'nope', name: 'Jo', password: 'weak' })
      .expect(400);
    expect(res.body.message).toEqual(expect.arrayContaining([expect.stringMatching(/email/i)]));
  });

  it('rejects unknown properties', () =>
    request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ ...user, isAdmin: true })
      .expect(400));

  it('signs up, sets httpOnly cookies and never returns the password hash', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/signup').send(user).expect(201);
    expect(res.body.user).toMatchObject({ email: user.email, name: user.name });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    const cookies = cookiesOf(res);
    expect(cookies.some((c) => /^access_token=.+HttpOnly/i.test(c))).toBe(true);
    expect(cookies.some((c) => /^refresh_token=.+HttpOnly/i.test(c))).toBe(true);
  });

  it('rejects a duplicate email with 409', () =>
    request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ ...user, email: user.email.toUpperCase() })
      .expect(409));

  it('signs in, reaches the protected endpoint, refreshes and signs out', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/signin').send({ email: user.email, password: 'wrong' }).expect(401);
    await agent.post('/api/auth/signin').send({ email: user.email, password: user.password }).expect(200);

    const me = await agent.get('/api/users/me').expect(200);
    expect(me.body.email).toBe(user.email);

    await agent.post('/api/auth/refresh').expect(200);
    await agent.get('/api/users/me').expect(200);

    await agent.post('/api/auth/signout').expect(204);
    await agent.get('/api/users/me').expect(401);
    await agent.post('/api/auth/refresh').expect(401);
  });

  it('reports health', () =>
    request(app.getHttpServer()).get('/api/health').expect(200).expect(({ body }) => {
      expect(body).toMatchObject({ status: 'ok', database: 'up' });
    }));
});
