import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QueryFailedError } from 'typeorm';
import { UserActivityLogService } from '../../activity/services/user-activity-log.service.js';
import type { AuthenticatedUser } from '../../common/strategies/jwt.strategy.js';
import { CircularReferenceException } from '../../common/exceptions/pages/circular-reference.exception.js';
import { InsufficientPagePermissionException } from '../../common/exceptions/pages/insufficient-page-permission.exception.js';
import { PageAccessForbiddenException } from '../../common/exceptions/pages/page-access-forbidden.exception.js';
import { PageHasChildrenException } from '../../common/exceptions/pages/page-has-children.exception.js';
import { PageNotFoundException } from '../../common/exceptions/pages/page-not-found.exception.js';
import { ParentPageNotFoundException } from '../../common/exceptions/pages/parent-page-not-found.exception.js';
import { SlugAlreadyExistsException } from '../../common/exceptions/pages/slug-already-exists.exception.js';
import { ValidationException } from '../../common/exceptions/validation.exception.js';
import {
  CHANGE_SUMMARY_MAX_LENGTH,
  SLUG_MAX_LENGTH,
  SLUG_REGEX,
  TITLE_MAX_LENGTH,
  UUID_REGEX,
} from '../../common/variables.global.js';
import { CreatePageDto } from '../dto/in/create-page.dto.js';
import { DeletePageQueryDto } from '../dto/in/delete-page-query.dto.js';
import { MovePageDto } from '../dto/in/move-page.dto.js';
import { PublishPageDto } from '../dto/in/publish-page.dto.js';
import { UpdatePageDto } from '../dto/in/update-page.dto.js';
import { PageTreeNodeDto } from '../dto/out/page-tree-node.dto.js';
import { PageVersion } from '../entities/page-version.entity.js';
import { Page, PAGE_VISIBILITIES } from '../entities/page.entity.js';
import {
  PAGE_PUBLISHED_EVENT,
  PagePublishedEvent,
} from '../events/page-published.event.js';
import { PageTreeMapper } from '../mapper/page-tree.mapper.js';
import type { PagesRepository } from '../persistence/page.repository.js';
import { PagePermissionsService } from './page-permissions.service.js';

const MYSQL_DUPLICATE_ENTRY_CODE = 'ER_DUP_ENTRY';

@Injectable()
export class PagesService {
  constructor(
    @Inject('PagesRepository')
    private readonly pagesRepository: PagesRepository,
    private readonly pagePermissionsService: PagePermissionsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly userActivityLogService: UserActivityLogService,
  ) {}

  async createPage(
    dto: CreatePageDto,
    createdById: string,
  ): Promise<{ page: Page; version: PageVersion }> {
    this.validateCreatePage(dto);

    const parentId = dto.parentId ?? null;
    if (parentId !== null) {
      const parent = await this.pagesRepository.findById(parentId);
      if (!parent) {
        throw new ParentPageNotFoundException();
      }
    }

    const existing = await this.pagesRepository.findBySlugAndParent(
      dto.slug,
      parentId,
    );
    if (existing) {
      throw new SlugAlreadyExistsException();
    }

    try {
      const result = await this.pagesRepository.createWithFirstVersion({
        slug: dto.slug,
        title: dto.title,
        content: dto.content,
        parentId,
        visibility: dto.visibility,
        createdById,
      });
      void this.userActivityLogService.record({
        userId: createdById,
        action: 'page.created',
        targetType: 'page',
        targetId: result.page.id,
        metadata: { title: dto.title, slug: dto.slug },
      });
      return result;
    } catch (error) {
      if (PagesService.isDuplicateSlugError(error)) {
        throw new SlugAlreadyExistsException();
      }
      throw error;
    }
  }

  async getTree(currentUser?: AuthenticatedUser): Promise<PageTreeNodeDto[]> {
    const pages = await this.pagesRepository.findAll();
    const visible = PagesService.hasFullAccess(currentUser)
      ? pages
      : pages.filter(
          (page) => page.visibility === 'public' && page.isPublished,
        );

    return PageTreeMapper.buildTree(visible);
  }

  async findByPath(
    segments: string[],
    currentUser?: AuthenticatedUser,
  ): Promise<{ page: Page; version: PageVersion }> {
    if (segments.length === 0) {
      throw new PageNotFoundException();
    }

    let parentId: string | null = null;
    let page: Page | null = null;
    for (const slug of segments) {
      page = await this.pagesRepository.findBySlugAndParent(slug, parentId);
      if (!page) {
        throw new PageNotFoundException();
      }
      parentId = page.id;
    }

    if (!page || !page.currentVersionId) {
      throw new PageNotFoundException();
    }

    PagesService.assertAccessible(page, currentUser);

    const version = await this.pagesRepository.findVersionById(
      page.currentVersionId,
    );
    if (!version) {
      throw new PageNotFoundException();
    }

    return { page, version };
  }

  async getAncestorPath(page: Page): Promise<string> {
    const segments = [page.slug];
    let parentId = page.parentId;
    while (parentId !== null) {
      const parent: Page | null = await this.pagesRepository.findById(parentId);
      if (!parent) {
        break;
      }
      segments.unshift(parent.slug);
      parentId = parent.parentId;
    }
    return `/${segments.join('/')}`;
  }

  async listChildren(
    parentId: string,
    currentUser?: AuthenticatedUser,
  ): Promise<Page[]> {
    await this.getByIdOrFail(parentId, currentUser);
    const children = await this.pagesRepository.findChildren(parentId);
    return PagesService.hasFullAccess(currentUser)
      ? children
      : children.filter(
          (page) => page.visibility === 'public' && page.isPublished,
        );
  }

  async getByIdOrFail(
    id: string,
    currentUser?: AuthenticatedUser,
  ): Promise<Page> {
    const page = await this.pagesRepository.findById(id);
    if (!page) {
      throw new PageNotFoundException();
    }

    PagesService.assertAccessible(page, currentUser);

    return page;
  }

  async createNewVersionFromContent(
    pageId: string,
    content: string,
    authorId: string,
    changeSummary: string | null,
  ): Promise<{ page: Page; version: PageVersion }> {
    const page = await this.pagesRepository.findById(pageId);
    if (!page || !page.currentVersionId) {
      throw new PageNotFoundException();
    }

    const result = await this.pagesRepository.updateWithNewVersion({
      page,
      title: page.title,
      content,
      changeSummary,
      authorId,
    });
    void this.userActivityLogService.record({
      userId: authorId,
      action: 'page.restored',
      targetType: 'page',
      targetId: pageId,
      metadata: { changeSummary },
    });
    return result;
  }

  async updatePage(
    id: string,
    dto: UpdatePageDto,
    authorId: string,
  ): Promise<{ page: Page; version: PageVersion }> {
    const page = await this.pagesRepository.findById(id);
    if (!page || !page.currentVersionId) {
      throw new PageNotFoundException();
    }

    await this.assertCanEdit(id, authorId);

    const currentVersion = await this.pagesRepository.findVersionById(
      page.currentVersionId,
    );
    if (!currentVersion) {
      throw new PageNotFoundException();
    }

    this.validateUpdatePage(dto);

    const title = dto.title ?? page.title;
    const content = dto.content ?? currentVersion.content;

    const result = await this.pagesRepository.updateWithNewVersion({
      page,
      title,
      content,
      changeSummary: dto.changeSummary ?? null,
      authorId,
    });
    void this.userActivityLogService.record({
      userId: authorId,
      action: 'page.updated',
      targetType: 'page',
      targetId: id,
      metadata: { changeSummary: dto.changeSummary ?? null },
    });
    return result;
  }

  async movePage(
    id: string,
    dto: MovePageDto,
    userId: string,
  ): Promise<{ page: Page; version: PageVersion }> {
    this.validateMovePage(dto);

    const page = await this.pagesRepository.findById(id);
    if (!page || !page.currentVersionId) {
      throw new PageNotFoundException();
    }

    await this.assertCanEdit(id, userId);

    const currentVersion = await this.pagesRepository.findVersionById(
      page.currentVersionId,
    );
    if (!currentVersion) {
      throw new PageNotFoundException();
    }

    const newParentId = dto.newParentId;
    if (newParentId !== null) {
      let currentId: string | null = newParentId;
      while (currentId !== null) {
        if (currentId === id) {
          throw new CircularReferenceException();
        }
        const ancestor: Page | null =
          await this.pagesRepository.findById(currentId);
        if (!ancestor) {
          throw new ParentPageNotFoundException();
        }
        currentId = ancestor.parentId;
      }
    }

    const existing = await this.pagesRepository.findBySlugAndParent(
      page.slug,
      newParentId,
    );
    if (existing && existing.id !== page.id) {
      throw new SlugAlreadyExistsException();
    }

    try {
      const moved = await this.pagesRepository.updateParent(page, newParentId);
      void this.userActivityLogService.record({
        userId,
        action: 'page.moved',
        targetType: 'page',
        targetId: id,
        metadata: { newParentId },
      });
      return { page: moved, version: currentVersion };
    } catch (error) {
      if (PagesService.isDuplicateSlugError(error)) {
        throw new SlugAlreadyExistsException();
      }
      throw error;
    }
  }

  async deletePage(
    id: string,
    query: DeletePageQueryDto,
    userId: string,
  ): Promise<void> {
    const page = await this.pagesRepository.findById(id);
    if (!page) {
      throw new PageNotFoundException();
    }

    await this.assertCanEdit(id, userId);

    const cascade = PagesService.parseCascade(query.cascade);
    const children = await this.pagesRepository.findChildren(id);

    if (children.length > 0 && !cascade) {
      throw new PageHasChildrenException();
    }

    if (cascade) {
      await this.deleteRecursive(id);
    } else {
      await this.pagesRepository.softDelete(id);
    }
    void this.userActivityLogService.record({
      userId,
      action: 'page.deleted',
      targetType: 'page',
      targetId: id,
      metadata: { cascade },
    });
  }

  async setPublishStatus(
    id: string,
    dto: PublishPageDto,
    userId: string,
  ): Promise<{ page: Page; version: PageVersion }> {
    this.validatePublishPage(dto);

    const page = await this.pagesRepository.findById(id);
    if (!page || !page.currentVersionId) {
      throw new PageNotFoundException();
    }

    await this.assertCanEdit(id, userId);

    const version = await this.pagesRepository.findVersionById(
      page.currentVersionId,
    );
    if (!version) {
      throw new PageNotFoundException();
    }

    const wasPublished = page.isPublished;
    const updated = await this.pagesRepository.updatePublishStatus(
      page,
      dto.isPublished,
    );

    if (!wasPublished && updated.isPublished) {
      this.eventEmitter.emit(
        PAGE_PUBLISHED_EVENT,
        new PagePublishedEvent(updated.id, updated.slug, updated.title),
      );
    }

    return { page: updated, version };
  }

  private async assertCanEdit(pageId: string, userId: string): Promise<void> {
    const canEdit = await this.pagePermissionsService.canEdit(userId, pageId);
    if (!canEdit) {
      throw new InsufficientPagePermissionException();
    }
  }

  private async deleteRecursive(id: string): Promise<void> {
    const children = await this.pagesRepository.findChildren(id);
    for (const child of children) {
      await this.deleteRecursive(child.id);
    }
    await this.pagesRepository.softDelete(id);
  }

  private static parseCascade(raw?: string): boolean {
    return raw === 'true';
  }

  private static isDuplicateSlugError(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as { driverError?: { code?: string } }).driverError?.code ===
        MYSQL_DUPLICATE_ENTRY_CODE
    );
  }

  private static hasFullAccess(currentUser?: AuthenticatedUser): boolean {
    return currentUser?.role === 'admin' || currentUser?.role === 'editor';
  }

  private static assertAccessible(
    page: Page,
    currentUser?: AuthenticatedUser,
  ): void {
    const isPubliclyAccessible =
      page.visibility === 'public' && page.isPublished;
    if (!isPubliclyAccessible && !PagesService.hasFullAccess(currentUser)) {
      throw new PageAccessForbiddenException();
    }
  }

  private validateCreatePage(dto: CreatePageDto): void {
    const errors: string[] = [];

    if (!dto.slug || dto.slug.length > SLUG_MAX_LENGTH) {
      errors.push(
        `slug must be longer than or equal to 1 and shorter than or equal to ${SLUG_MAX_LENGTH} characters`,
      );
    } else if (!SLUG_REGEX.test(dto.slug)) {
      errors.push(`slug must match ${SLUG_REGEX}`);
    }

    if (!dto.title || dto.title.length > TITLE_MAX_LENGTH) {
      errors.push(
        `title must be longer than or equal to 1 and shorter than or equal to ${TITLE_MAX_LENGTH} characters`,
      );
    }

    if (typeof dto.content !== 'string') {
      errors.push('content must be a string');
    }

    if (!PAGE_VISIBILITIES.includes(dto.visibility)) {
      errors.push(
        `visibility must be one of the following values: ${PAGE_VISIBILITIES.join(', ')}`,
      );
    }

    if (errors.length > 0) {
      throw new ValidationException(errors.join(', '));
    }
  }

  private validatePublishPage(dto: PublishPageDto): void {
    if (typeof dto.isPublished !== 'boolean') {
      throw new ValidationException('isPublished must be a boolean value');
    }
  }

  private validateMovePage(dto: MovePageDto): void {
    if (
      dto.newParentId !== null &&
      (typeof dto.newParentId !== 'string' || !UUID_REGEX.test(dto.newParentId))
    ) {
      throw new ValidationException('newParentId must be a UUID');
    }
  }

  private validateUpdatePage(dto: UpdatePageDto): void {
    const errors: string[] = [];

    if (
      dto.title !== undefined &&
      (!dto.title || dto.title.length > TITLE_MAX_LENGTH)
    ) {
      errors.push(
        `title must be longer than or equal to 1 and shorter than or equal to ${TITLE_MAX_LENGTH} characters`,
      );
    }

    if (dto.content !== undefined && typeof dto.content !== 'string') {
      errors.push('content must be a string');
    }

    if (
      dto.changeSummary !== undefined &&
      (typeof dto.changeSummary !== 'string' ||
        dto.changeSummary.length > CHANGE_SUMMARY_MAX_LENGTH)
    ) {
      errors.push(
        `changeSummary must be shorter than or equal to ${CHANGE_SUMMARY_MAX_LENGTH} characters`,
      );
    }

    if (errors.length > 0) {
      throw new ValidationException(errors.join(', '));
    }
  }
}
