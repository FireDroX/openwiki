import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { dataOf } from './support/api-response.js';
import { createTestApp } from './support/create-test-app.js';
import { resetDatabase } from './support/reset-database.js';

type HttpServer = Parameters<typeof request>[0];

interface PageResponse {
  id: string;
  currentVersion: { id: string; content: string };
}

interface PageUpdateResponse {
  content: string;
  currentVersionId: string;
}

interface VersionsPage {
  total: number;
}

async function registerEditor(
  app: INestApplication,
  dataSource: DataSource,
  email: string,
): Promise<request.Agent> {
  const password = 'Str0ng!Passw0rd';
  const agent = request.agent(app.getHttpServer() as HttpServer);

  await agent.post('/api/auth/register').send({
    email,
    password,
    displayName: 'Editor',
    turnstileToken: 'stubbed',
  });

  // Registration always creates a 'reader'; promote directly in the DB
  // then re-login so the fresh JWT payload carries the 'editor' role
  // (the role is baked into the token at issuance, not looked up per
  // request).
  await dataSource.query('UPDATE `users` SET `role` = ? WHERE `email` = ?', [
    'editor',
    email,
  ]);
  await agent.post('/api/auth/login').send({
    email,
    password,
    turnstileToken: 'stubbed',
  });

  return agent;
}

describe('Pages (e2e)', () => {
  let app: INestApplication;
  let close: () => Promise<void>;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
    dataSource = app.get(DataSource);
  });

  afterEach(async () => {
    await resetDatabase(dataSource);
  });

  afterAll(async () => {
    await close();
  });

  it('creates a page, edits it, then restores the original version', async () => {
    const agent = await registerEditor(app, dataSource, 'editor@example.com');

    const createResponse = await agent.post('/api/pages').send({
      slug: 'getting-started',
      title: 'Getting started',
      content: 'Original content',
      visibility: 'public',
    });

    expect(createResponse.status).toBe(201);
    const created = dataOf<PageResponse>(createResponse);
    const pageId = created.id;
    const firstVersionId = created.currentVersion.id;

    const editResponse = await agent.patch(`/api/pages/${pageId}`).send({
      content: 'Edited content',
      changeSummary: 'Clarify the intro',
    });

    expect(editResponse.status).toBe(200);
    const edited = dataOf<PageUpdateResponse>(editResponse);
    expect(edited.content).toBe('Edited content');
    const secondVersionId = edited.currentVersionId;
    expect(secondVersionId).not.toBe(firstVersionId);

    const afterEditVersions = await agent.get(`/api/pages/${pageId}/versions`);
    expect(dataOf<VersionsPage>(afterEditVersions).total).toBe(2);

    const restoreResponse = await agent.post(
      `/api/pages/${pageId}/versions/${firstVersionId}/restore`,
    );

    expect(restoreResponse.status).toBe(201);
    const restored = dataOf<PageUpdateResponse>(restoreResponse);
    expect(restored.content).toBe('Original content');
    const thirdVersionId = restored.currentVersionId;
    expect(thirdVersionId).not.toBe(firstVersionId);
    expect(thirdVersionId).not.toBe(secondVersionId);

    const afterRestoreVersions = await agent.get(
      `/api/pages/${pageId}/versions`,
    );
    expect(dataOf<VersionsPage>(afterRestoreVersions).total).toBe(3);

    const currentPage = await agent.get('/api/pages/getting-started');
    expect(dataOf<{ content: string }>(currentPage).content).toBe(
      'Original content',
    );
  });

  it('rejects page creation from a reader with 403', async () => {
    const agent = request.agent(app.getHttpServer() as HttpServer);
    await agent.post('/api/auth/register').send({
      email: 'reader@example.com',
      password: 'Str0ng!Passw0rd',
      displayName: 'Reader',
      turnstileToken: 'stubbed',
    });
    await agent.post('/api/auth/login').send({
      email: 'reader@example.com',
      password: 'Str0ng!Passw0rd',
      turnstileToken: 'stubbed',
    });

    const response = await agent.post('/api/pages').send({
      slug: 'blocked',
      title: 'Blocked',
      content: 'content',
      visibility: 'public',
    });

    expect(response.status).toBe(403);
  });
});
