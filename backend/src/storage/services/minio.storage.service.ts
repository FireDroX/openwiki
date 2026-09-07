import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';
import { StorageService } from './storage.service.js';

@Injectable()
export class MinioStorageService implements StorageService, OnModuleInit {
  private readonly logger = new Logger(MinioStorageService.name);

  constructor(
    @Inject('MinioInternalClient') private readonly client: Client,
    // MINIO_ENDPOINT (this.client) is the address the backend uses to
    // reach Minio server-to-server (the Docker service name in
    // production) — not reachable from a browser, so it can't be
    // embedded in a presigned URL handed to a client. presignClient
    // signs against MINIO_PUBLIC_ENDPOINT instead (falls back to the
    // internal client, same instance, when unset — see storage.module.ts).
    @Inject('MinioPresignClient') private readonly presignClient: Client,
    @Inject('StorageBuckets') private readonly buckets: string[],
  ) {}

  async onModuleInit(): Promise<void> {
    for (const bucket of this.buckets) {
      const alreadyExists = await this.client.bucketExists(bucket);
      if (alreadyExists) {
        continue;
      }

      await this.client.makeBucket(bucket);
      this.logger.log(`Bucket "${bucket}" created`);
    }
  }

  async upload(
    bucket: string,
    key: string,
    file: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.client.putObject(bucket, key, file, file.length, {
      'Content-Type': contentType,
    });
  }

  async download(bucket: string, key: string): Promise<Buffer> {
    const stream = await this.client.getObject(bucket, key);
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }

    return Buffer.concat(chunks);
  }

  async getPresignedUrl(
    bucket: string,
    key: string,
    expiresInSeconds: number,
  ): Promise<string> {
    return this.presignClient.presignedGetObject(bucket, key, expiresInSeconds);
  }

  async delete(bucket: string, key: string): Promise<void> {
    await this.client.removeObject(bucket, key);
  }

  async exists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.client.statObject(bucket, key);
      return true;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  private isNotFoundError(error: unknown): boolean {
    return (
      error instanceof Error && (error as { code?: string }).code === 'NotFound'
    );
  }
}
