import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { AttachmentNotFoundException } from '../../common/exceptions/media/attachment-not-found.exception.js';
import { FileTooLargeException } from '../../common/exceptions/media/file-too-large.exception.js';
import { StorageDeleteFailedException } from '../../common/exceptions/media/storage-delete-failed.exception.js';
import { UnsupportedFileTypeException } from '../../common/exceptions/media/unsupported-file-type.exception.js';
import { ValidationException } from '../../common/exceptions/validation.exception.js';
import type { AuthenticatedUser } from '../../common/strategies/jwt.strategy.js';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  MEDIA_PRESIGNED_URL_EXPIRY_SECONDS,
  UUID_REGEX,
} from '../../common/variables.global.js';
import { PagesService } from '../../pages/services/pages.service.js';
import { StorageService } from '../../storage/services/storage.service.js';
import { UploadMediaDto } from '../dto/in/upload-media.dto.js';
import { Attachment } from '../entities/attachment.entity.js';
import type { AttachmentsRepository } from '../persistence/attachment.repository.js';

export interface UploadedMediaFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class MediaService {
  constructor(
    @Inject('AttachmentsRepository')
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly storageService: StorageService,
    private readonly pagesService: PagesService,
  ) {}

  async uploadFile(
    file: UploadedMediaFile | undefined,
    dto: UploadMediaDto,
    uploadedById: string,
  ): Promise<{ attachment: Attachment; url: string }> {
    if (!file) {
      throw new ValidationException('No file provided');
    }

    this.validateUpload(file, dto);

    const pageId = dto.pageId ?? null;
    const minioKey = `pages/${pageId ?? 'unassigned'}/${randomUUID()}-${file.originalname}`;

    await this.storageService.uploadFile(minioKey, file.buffer, file.mimetype);

    const attachment = await this.attachmentsRepository.create({
      pageId,
      minioKey,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedById,
    });

    const url = await this.storageService.getPresignedUrl(
      minioKey,
      MEDIA_PRESIGNED_URL_EXPIRY_SECONDS,
    );

    return { attachment, url };
  }

  async findAllByPage(
    pageId: string | undefined,
    currentUser?: AuthenticatedUser,
  ): Promise<{ attachment: Attachment; url: string }[]> {
    if (!pageId || !UUID_REGEX.test(pageId)) {
      throw new ValidationException('pageId must be a UUID');
    }

    await this.pagesService.getByIdOrFail(pageId, currentUser);

    const attachments =
      await this.attachmentsRepository.findAllByPageId(pageId);

    return Promise.all(
      attachments.map(async (attachment) => ({
        attachment,
        url: await this.storageService.getPresignedUrl(
          attachment.minioKey,
          MEDIA_PRESIGNED_URL_EXPIRY_SECONDS,
        ),
      })),
    );
  }

  async getPresignedUrl(
    id: string,
    currentUser?: AuthenticatedUser,
  ): Promise<{ url: string; expiresIn: number }> {
    if (!UUID_REGEX.test(id)) {
      throw new ValidationException('id must be a UUID');
    }

    const attachment = await this.attachmentsRepository.findById(id);
    if (!attachment) {
      throw new AttachmentNotFoundException();
    }

    if (attachment.pageId) {
      await this.pagesService.getByIdOrFail(attachment.pageId, currentUser);
    }

    const url = await this.storageService.getPresignedUrl(
      attachment.minioKey,
      MEDIA_PRESIGNED_URL_EXPIRY_SECONDS,
    );

    return { url, expiresIn: MEDIA_PRESIGNED_URL_EXPIRY_SECONDS };
  }

  async deleteAttachment(id: string): Promise<void> {
    if (!UUID_REGEX.test(id)) {
      throw new ValidationException('id must be a UUID');
    }

    const attachment = await this.attachmentsRepository.findById(id);
    if (!attachment) {
      throw new AttachmentNotFoundException();
    }

    try {
      await this.storageService.deleteFile(attachment.minioKey);
    } catch {
      throw new StorageDeleteFailedException();
    }

    await this.attachmentsRepository.delete(attachment.id);
  }

  private validateUpload(file: UploadedMediaFile, dto: UploadMediaDto): void {
    if (dto.pageId !== undefined && !UUID_REGEX.test(dto.pageId)) {
      throw new ValidationException('pageId must be a UUID');
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new FileTooLargeException();
    }

    if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
      throw new UnsupportedFileTypeException();
    }
  }
}
