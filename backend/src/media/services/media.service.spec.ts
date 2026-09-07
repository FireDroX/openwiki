import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AttachmentNotFoundException } from '../../common/exceptions/media/attachment-not-found.exception.js';
import { FileTooLargeException } from '../../common/exceptions/media/file-too-large.exception.js';
import { StorageDeleteFailedException } from '../../common/exceptions/media/storage-delete-failed.exception.js';
import { UnsupportedFileTypeException } from '../../common/exceptions/media/unsupported-file-type.exception.js';
import { ValidationException } from '../../common/exceptions/validation.exception.js';
import { MAX_ATTACHMENT_SIZE_BYTES } from '../../common/variables.global.js';
import { PagesService } from '../../pages/services/pages.service.js';
import { StorageService } from '../../storage/services/storage.service.js';
import { Attachment } from '../entities/attachment.entity.js';
import type { AttachmentsRepository } from '../persistence/attachment.repository.js';
import { MediaService, UploadedMediaFile } from './media.service.js';

function buildAttachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    id: '44444444-4444-4444-4444-444444444444',
    pageId: null,
    minioKey: 'pages/unassigned/some-key.png',
    filename: 'diagram.png',
    mimeType: 'image/png',
    size: 1024,
    uploadedById: 'user-1',
    createdAt: new Date(),
    ...overrides,
  };
}

function buildFile(
  overrides: Partial<UploadedMediaFile> = {},
): UploadedMediaFile {
  return {
    originalname: 'diagram.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('fake-image-bytes'),
    ...overrides,
  };
}

describe('MediaService', () => {
  let service: MediaService;
  let attachmentsRepository: {
    [K in keyof AttachmentsRepository]: Mock<AttachmentsRepository[K]>;
  };
  let storageService: {
    [K in 'uploadFile' | 'getPresignedUrl' | 'deleteFile']: Mock<
      StorageService[K]
    >;
  };
  let pagesService: { getByIdOrFail: Mock<PagesService['getByIdOrFail']> };

  beforeEach(async () => {
    attachmentsRepository = {
      create: vi.fn(),
      findAllByPageId: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn(),
    };
    storageService = {
      uploadFile: vi.fn().mockResolvedValue(undefined),
      getPresignedUrl: vi
        .fn()
        .mockResolvedValue('https://minio.local/presigned'),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    };
    pagesService = { getByIdOrFail: vi.fn() };

    const module = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: 'AttachmentsRepository', useValue: attachmentsRepository },
        { provide: StorageService, useValue: storageService },
        { provide: PagesService, useValue: pagesService },
      ],
    }).compile();

    service = module.get(MediaService);
  });

  describe('uploadFile', () => {
    const pageId = '11111111-1111-1111-1111-111111111111';

    it('uploads to storage with the pages/{pageId}/{uuid}-{filename} key and persists the attachment', async () => {
      const file = buildFile();
      attachmentsRepository.create.mockImplementation((input) =>
        Promise.resolve({
          id: 'attachment-1',
          ...input,
          createdAt: new Date(),
        }),
      );

      const result = await service.uploadFile(file, { pageId }, 'user-1');

      expect(storageService.uploadFile).toHaveBeenCalledTimes(1);
      const [key, buffer, mimeType] = storageService.uploadFile.mock.calls[0];
      expect(key).toMatch(
        new RegExp(`^pages/${pageId}/[0-9a-f-]{36}-diagram\\.png$`),
      );
      expect(buffer).toBe(file.buffer);
      expect(mimeType).toBe('image/png');

      expect(attachmentsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          pageId,
          filename: 'diagram.png',
          mimeType: 'image/png',
          size: 1024,
          uploadedById: 'user-1',
        }),
      );
      expect(result.url).toBe('https://minio.local/presigned');
    });

    it('throws FileTooLargeException when the file exceeds the max size and never calls storage', async () => {
      const file = buildFile({ size: MAX_ATTACHMENT_SIZE_BYTES + 1 });

      await expect(
        service.uploadFile(file, {}, 'user-1'),
      ).rejects.toBeInstanceOf(FileTooLargeException);
      expect(storageService.uploadFile).not.toHaveBeenCalled();
      expect(attachmentsRepository.create).not.toHaveBeenCalled();
    });

    it('throws UnsupportedFileTypeException for a disallowed mime type and never calls storage', async () => {
      const file = buildFile({ mimetype: 'application/x-executable' });

      await expect(
        service.uploadFile(file, {}, 'user-1'),
      ).rejects.toBeInstanceOf(UnsupportedFileTypeException);
      expect(storageService.uploadFile).not.toHaveBeenCalled();
      expect(attachmentsRepository.create).not.toHaveBeenCalled();
    });

    it('throws ValidationException when dto.pageId is not a UUID', async () => {
      await expect(
        service.uploadFile(buildFile(), { pageId: 'not-a-uuid' }, 'user-1'),
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('throws ValidationException when no file was provided', async () => {
      await expect(
        service.uploadFile(undefined, {}, 'user-1'),
      ).rejects.toBeInstanceOf(ValidationException);
    });
  });

  describe('findAllByPage', () => {
    const pageId = '11111111-1111-1111-1111-111111111111';

    it('returns attachments with presigned URLs for an accessible page', async () => {
      pagesService.getByIdOrFail.mockResolvedValue(undefined);
      attachmentsRepository.findAllByPageId.mockResolvedValue([
        buildAttachment({ pageId }),
      ]);

      const result = await service.findAllByPage(pageId, undefined);

      expect(pagesService.getByIdOrFail).toHaveBeenCalledWith(
        pageId,
        undefined,
      );
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://minio.local/presigned');
    });

    it('throws ValidationException when pageId is missing or invalid', async () => {
      await expect(
        service.findAllByPage(undefined, undefined),
      ).rejects.toBeInstanceOf(ValidationException);
      await expect(
        service.findAllByPage('not-a-uuid', undefined),
      ).rejects.toBeInstanceOf(ValidationException);
    });
  });

  describe('getPresignedUrl', () => {
    const id = '44444444-4444-4444-4444-444444444444';

    it('returns a presigned URL for an existing unattached attachment', async () => {
      attachmentsRepository.findById.mockResolvedValue(
        buildAttachment({ id, pageId: null }),
      );

      const result = await service.getPresignedUrl(id, undefined);

      expect(result.url).toBe('https://minio.local/presigned');
      expect(pagesService.getByIdOrFail).not.toHaveBeenCalled();
    });

    it('checks page access when the attachment is linked to a page', async () => {
      const pageId = '11111111-1111-1111-1111-111111111111';
      attachmentsRepository.findById.mockResolvedValue(
        buildAttachment({ id, pageId }),
      );

      await service.getPresignedUrl(id, undefined);

      expect(pagesService.getByIdOrFail).toHaveBeenCalledWith(
        pageId,
        undefined,
      );
    });

    it('throws AttachmentNotFoundException when the attachment does not exist', async () => {
      attachmentsRepository.findById.mockResolvedValue(null);

      await expect(
        service.getPresignedUrl(id, undefined),
      ).rejects.toBeInstanceOf(AttachmentNotFoundException);
    });
  });

  describe('deleteAttachment', () => {
    const id = '44444444-4444-4444-4444-444444444444';

    it('deletes the file from storage then the attachment row', async () => {
      const attachment = buildAttachment({ id });
      attachmentsRepository.findById.mockResolvedValue(attachment);

      await service.deleteAttachment(id);

      expect(storageService.deleteFile).toHaveBeenCalledWith(
        attachment.minioKey,
      );
      expect(attachmentsRepository.delete).toHaveBeenCalledWith(id);
    });

    it('throws AttachmentNotFoundException when the attachment does not exist', async () => {
      attachmentsRepository.findById.mockResolvedValue(null);

      await expect(service.deleteAttachment(id)).rejects.toBeInstanceOf(
        AttachmentNotFoundException,
      );
    });

    it('throws StorageDeleteFailedException when storage deletion fails', async () => {
      attachmentsRepository.findById.mockResolvedValue(buildAttachment({ id }));
      storageService.deleteFile.mockRejectedValue(new Error('minio down'));

      await expect(service.deleteAttachment(id)).rejects.toBeInstanceOf(
        StorageDeleteFailedException,
      );
      expect(attachmentsRepository.delete).not.toHaveBeenCalled();
    });
  });
});
