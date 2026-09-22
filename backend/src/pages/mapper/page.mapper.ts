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
    isFollowed: boolean,
    canEdit: boolean,
  ): PageDetailResponseDto {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: version.content,
      visibility: page.visibility,
      commentsEnabled: page.commentsEnabled,
      parentId: page.parentId,
      updatedAt: page.updatedAt,
      isFollowed,
      canEdit,
    };
  }

  static toDetailResponse(
    page: Page,
    version: PageVersion,
    isFollowed: boolean,
    canEdit: boolean,
  ): ResponseDto<PageDetailResponseDto> {
    return new ResponseDto(
      PageMapper.toPageDetailResponseDto(page, version, isFollowed, canEdit),
    );
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
