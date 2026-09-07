import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './support/create-test-app.js';

describe('AppModule (e2e)', () => {
  let app: INestApplication;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
  });

  afterAll(async () => {
    await close();
  });

  it('boots the full Nest application wired to the e2e test database', () => {
    const dataSource = app.get(DataSource);

    expect(dataSource.isInitialized).toBe(true);
    expect(dataSource.options).toMatchObject({ type: 'mysql' });
  });

  it('responds on GET /api/health', async () => {
    const response = await request(
      app.getHttpServer() as Parameters<typeof request>[0],
    ).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
