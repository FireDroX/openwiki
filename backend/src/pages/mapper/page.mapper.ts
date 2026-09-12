import { ResponseDto } from '../../common/dto/response.dto.js';
import { PageDetailResponseDto } from '../dto/out/page-detail-response.dto.js';
import { PageResponseDto } from '../dto/out/page-response.dto.js';
import { PageUpdateResponseDto } from '../dto/out/page-update-response.dto.js';
import { PageVersion } from '../entities/page-version.entity.js';
import { Page } from '../entities/page.entity.js';

export class PageMapper {
  static toPageResponseDto(page: Page, version: PageVersion): PageResponseDto {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      parentId: page.parentId,
      visibility: page.visibility,
      isPublished: page.isPublished,
      commentsEnabled: page.commentsEnabled,
      currentVersion: {
        id: version.id,
        content: version.content,
      },
      createdAt: page.createdAt,
    };
  }

  static toResponse(
    page: Page,
    version: PageVersion,
  ): ResponseDto<PageResponseDto> {
    return new ResponseDto(PageMapper.toPageResponseDto(page, version));
  }

  static toPageDetailResponseDto(
    page: Page,
    version: PageVersion,
  ): PageDetailResponseDto {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: version.content,
      visibility: page.visibility,
      isPublished: page.isPublished,
      commentsEnabled: page.commentsEnabled,
      parentId: page.parentId,
      updatedAt: page.updatedAt,
    };
  }

  static toDetailResponse(
    page: Page,
    version: PageVersion,
  ): ResponseDto<PageDetailResponseDto> {
    return new ResponseDto(PageMapper.toPageDetailResponseDto(page, version));
  }

  static toPageUpdateResponseDto(
    page: Page,
    version: PageVersion,
  ): PageUpdateResponseDto {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: version.content,
      currentVersionId: page.currentVersionId!,
      updatedAt: page.updatedAt,
    };
  }

  static toUpdateResponse(
    page: Page,
    version: PageVersion,
  ): ResponseDto<PageUpdateResponseDto> {
    return new ResponseDto(PageMapper.toPageUpdateResponseDto(page, version));
  }
}
