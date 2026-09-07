import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { MinioStorageService } from './services/minio.storage.service.js';

@Module({
  providers: [
    {
      provide: 'MinioInternalClient',
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Client({
          endPoint: config.get<string>('MINIO_ENDPOINT')!,
          // ConfigService.get<number>() never actually casts —
          // process.env values are always strings, the generic is a
          // compile-time-only assertion. minio-js compares the port
          // against the literal numbers 80/443 with strict `!==` to
          // decide whether to suffix the signed Host header; left as
          // a string, "443" !== 443 is true, so it wrongly appends
          // ":443" to what it signs even on the default HTTPS port.
          // Number(...) here is load-bearing, not decorative.
          port: Number(config.get<string>('MINIO_PORT')),
          accessKey: config.get<string>('MINIO_ACCESS_KEY'),
          secretKey: config.get<string>('MINIO_SECRET_KEY'),
          useSSL: config.get<string>('MINIO_USE_SSL') === 'true',
        }),
    },
    {
      provide: 'MinioPresignClient',
      inject: [ConfigService, 'MinioInternalClient'],
      // MINIO_PUBLIC_ENDPOINT, when set, is the publicly routable host
      // (e.g. a Cloudflare-tunnelled domain) used only to sign
      // presigned URLs; unset, presigning falls back to the internal
      // client (dev default, where both usually coincide).
      useFactory: (config: ConfigService, internalClient: Client) => {
        const publicEndpoint = config.get<string>('MINIO_PUBLIC_ENDPOINT');
        if (!publicEndpoint) {
          return internalClient;
        }

        return new Client({
          endPoint: publicEndpoint,
          port: Number(config.get<string>('MINIO_PUBLIC_PORT')) || 443,
          accessKey: config.get<string>('MINIO_ACCESS_KEY'),
          secretKey: config.get<string>('MINIO_SECRET_KEY'),
          useSSL: config.get<string>('MINIO_PUBLIC_USE_SSL') !== 'false',
        });
      },
    },
    {
      provide: 'StorageBuckets',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        config.get<string>('MINIO_BUCKET')!,
      ],
    },
    {
      provide: 'StorageService',
      useClass: MinioStorageService,
    },
  ],
  exports: ['StorageService'],
})
export class StorageModule {}
