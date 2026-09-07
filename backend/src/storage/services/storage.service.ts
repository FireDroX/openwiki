import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: Client;
  private readonly presignClient: Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('MINIO_BUCKET')!;
    const accessKey = config.get<string>('MINIO_ACCESS_KEY');
    const secretKey = config.get<string>('MINIO_SECRET_KEY');
    this.client = new Client({
      endPoint: config.get<string>('MINIO_ENDPOINT')!,
      port: config.get<number>('MINIO_PORT'),
      accessKey,
      secretKey,
      useSSL: config.get<string>('MINIO_USE_SSL') === 'true',
    });

    // MINIO_ENDPOINT is the address the backend uses to reach Minio
    // server-to-server (the Docker service name in production) — not
    // reachable from a browser, so it can't be embedded in a presigned
    // URL handed to a client. MINIO_PUBLIC_ENDPOINT, when set, is the
    // publicly routable host (e.g. a Cloudflare-tunnelled domain) used
    // only to generate presigned URLs; unset, it falls back to
    // MINIO_ENDPOINT (dev default, where both usually coincide).
    const publicEndpoint = config.get<string>('MINIO_PUBLIC_ENDPOINT');
    this.presignClient = publicEndpoint
      ? new Client({
          endPoint: publicEndpoint,
          port: config.get<number>('MINIO_PUBLIC_PORT') ?? 443,
          accessKey,
          secretKey,
          useSSL: config.get<string>('MINIO_PUBLIC_USE_SSL') !== 'false',
        })
      : this.client;
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucketExists();
  }

  async ensureBucketExists(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      this.logger.log(`Bucket "${this.bucket}" created`);
    }
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': mimeType,
    });
  }

  async getPresignedUrl(key: string, expirySeconds: number): Promise<string> {
    return this.presignClient.presignedGetObject(
      this.bucket,
      key,
      expirySeconds,
    );
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}
