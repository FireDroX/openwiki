export interface StorageService {
  upload(
    bucket: string,
    key: string,
    file: Buffer,
    contentType: string,
  ): Promise<void>;
  download(bucket: string, key: string): Promise<Buffer>;
  getPresignedUrl(
    bucket: string,
    key: string,
    expiresInSeconds: number,
  ): Promise<string>;
  delete(bucket: string, key: string): Promise<void>;
  exists(bucket: string, key: string): Promise<boolean>;
}
