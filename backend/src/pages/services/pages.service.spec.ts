import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { UserActivityLogService } from '../../activity/services/user-activity-log.service.js';
import { CircularReferenceException } from '../../common/exceptions/pages/circular-reference.exception.js';
import { InsufficientPagePermissionException } from '../../common/exceptions/pages/insufficient-page-permission.exception.js';
import { PageAccessForbiddenException } from '../../common/exceptions/pages/page-access-forbidden.exception.js';
import { PageHasChildrenException } from '../../common/exceptions/pages/page-has-children.exception.js';
import { PageNotFoundException } from '../../common/exceptions/pages/page-not-found.exception.js';
import { ParentPageNotFoundException } from '../../common/exceptions/pages/parent-page-not-found.exception.js';
import { SlugAlreadyExistsException } from '../../common/exceptions/pages/slug-already-exists.exception.js';
import { ValidationException } from '../../common/exceptions/validation.exception.js';
import type { AuthenticatedUser } from '../../common/strategies/jwt.strategy.js';
import { ChangeVisibilityDto } from '../dto/in/change-visibility.dto.js';
import { CreatePageDto } from '../dto/in/create-page.dto.js';
import { MovePageDto } from '../dto/in/move-page.dto.js';
import { SetCommentsEnabledDto } from '../dto/in/set-comments-enabled.dto.js';
import { UpdatePageDto } from '../dto/in/update-page.dto.js';
import { Page } from '../entities/page.entity.js';
import { PageVersion } from '../entities/page-version.entity.js';
import { PAGE_PUBLISHED_EVENT } from '../events/page-published.event.js';
import type { PageFollowRepository } from '../persistence/page-follow.repository.js';
import type { PagesRepository } from '../persistence/page.repository.js';
import { PagePermissionsService } from './page-permissions.service.js';
import { PagesService } from './pages.service.js';

const reader: AuthenticatedUser = {
  id: 'r1',
  email: 'r@x.com',
  role: 'reader',
};
const editor: AuthenticatedUser = {
  id: 'e1',
  email: 'e@x.com',
  role: 'editor',
};

function buildPage(overrides: Partial<Page> = {}): Page {
  return {
    id: 'page-1',
    slug: 'home',
    title: 'Home',
    parentId: null,
    currentVersionId: 'version-1',
    visibility: 'public',
    commentsEnabled: true,
    viewCount: 0,
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function buildVersion(overrides: Partial<PageVersion> = {}): PageVersion {
  return {
    id: 'version-1',
    pageId: 'page-1',
    content: 'original content',
    title: 'Home',
    authorId: 'user-1',
    changeSummary: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('PagesService', () => {
  let service: PagesService;
  let pagesRepository: {
    [K in keyof PagesRepository]: Mock<PagesRepository[K]>;
  };
  let pageFollowRepository: {
    [K in keyof PageFollowRepository]: Mock<PageFollowRepository[K]>;
  };
  let pagePermissionsService: {
    canEdit: Mock<(userId: string, pageId: string) => Promise<boolean>>;
  };
  let eventEmitter: { emit: ReturnType<typeof vi.fn> };
  let userActivityLogService: { record: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    pagesRepository = {
      findById: vi.fn(),
      findBySlugAndParent: vi.fn(),
      findAll: vi.fn(),
      findVersionById: vi.fn(),
      createWithFirstVersion: vi.fn(),
      updateWithNewVersion: vi.fn(),
      updateParent: vi.fn(),
      findChildren: vi.fn(),
      softDelete: vi.fn(),
      updateVisibility: vi.fn(),
      updateCommentsEnabled: vi.fn(),
      countCreatedByUser: vi.fn(),
      countVersionsByAuthor: vi.fn(),
      incrementViewCount: vi.fn(),
      findTopPublicByViewCount: vi.fn(),
    };
    pageFollowRepository = {
      follow: vi.fn(),
      unfollow: vi.fn(),
      findFollowedPageIds: vi.fn(),
      isFollowing: vi.fn().mockResolvedValue(false),
    };
    pagePermissionsService = { canEdit: vi.fn().mockResolvedValue(true) };
    eventEmitter = { emit: vi.fn() };
    userActivityLogService = { record: vi.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        PagesService,
        { provide: 'PagesRepository', useValue: pagesRepository },
        { provide: 'PageFollowsRepository', useValue: pageFollowRepository },
        { provide: PagePermissionsService, useValue: pagePermissionsService },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: UserActivityLogService, useValue: userActivityLogService },
      ],
    }).compile();

    service = module.get(PagesService);
  });

  describe('updatePage', () => {
    it('creates a new PageVersion and never mutates the existing one', async () => {
      const page = buildPage();
      const currentVersion = buildVersion();
      const dto: UpdatePageDto = { content: 'updated content' };
      const newVersion = buildVersion({
        id: 'version-2',
        content: 'updated content',
      });

      pagesRepository.findById.mockResolvedValue(page);
      pagesRepository.findVersionById.mockResolvedValue(currentVersion);
      pagesRepository.updateWithNewVersion.mockResolvedValue({
        page: { ...page, currentVersionId: 'version-2' },
        version: newVersion,
      });

      const result = await service.updatePage('page-1', dto, 'user-1');

      expect(pagesRepository.updateWithNewVersion).toHaveBeenCalledWith({
        page,
        title: page.title,
        content: 'updated content',
        changeSummary: null,
        authorId: 'user-1',
      });
      expect(currentVersion.content).toBe('original content');
      expect(result.version.id).toBe('version-2');
      expect(result.page.currentVersionId).toBe('version-2');
    });

    it('throws PageNotFoundException when the page does not exist', async () => {
      pagesRepository.findById.mockResolvedValue(null);

      await expect(
        service.updatePage('missing', {}, 'user-1'),
      ).rejects.toBeInstanceOf(PageNotFoundException);
    });

    it('throws InsufficientPagePermissionException when the user cannot edit', async () => {
      pagesRepository.findById.mockResolvedValue(buildPage());
      pagePermissionsService.canEdit.mockResolvedValue(false);

      await expect(
        service.updatePage('page-1', {}, 'user-2'),
      ).rejects.toBeInstanceOf(InsufficientPagePermissionException);
      expect(pagesRepository.updateWithNewVersion).not.toHaveBeenCalled();
    });
  });

  describe('movePage', () => {
    const pageId = '11111111-1111-1111-1111-111111111111';
    const childId = '22222222-2222-2222-2222-222222222222';
    const otherId = '33333333-3333-3333-3333-333333333333';

    it('detects a cycle when newParentId is a descendant of the page', async () => {
      const page = buildPage({ id: pageId, parentId: null });
      const child = buildPage({ id: childId, parentId: pageId });
      const dto: MovePageDto = { newParentId: childId };

      pagesRepository.findById.mockImplementation((id: string) => {
        if (id === pageId) return Promise.resolve(page);
        if (id === childId) return Promise.resolve(child);
        return Promise.resolve(null);
      });
      pagesRepository.findVersionById.mockResolvedValue(buildVersion());

      await expect(
        service.movePage(pageId, dto, 'user-1'),
      ).rejects.toBeInstanceOf(CircularReferenceException);
      expect(pagesRepository.updateParent).not.toHaveBeenCalled();
    });

    it('moves the page when newParentId is not a descendant', async () => {
      const page = buildPage({ id: pageId, parentId: null });
      const target = buildPage({ id: otherId, parentId: null });
      const dto: MovePageDto = { newParentId: otherId };

      pagesRepository.findById.mockImplementation((id: string) => {
        if (id === pageId) return Promise.resolve(page);
        if (id === otherId) return Promise.resolve(target);
        return Promise.resolve(null);
      });
      pagesRepository.findVersionById.mockResolvedValue(buildVersion());
      pagesRepository.findBySlugAndParent.mockResolvedValue(null);
      pagesRepository.updateParent.mockResolvedValue({
        ...page,
        parentId: otherId,
      });

      const result = await service.movePage(pageId, dto, 'user-1');

      expect(pagesRepository.updateParent).toHaveBeenCalledWith(page, otherId);
      expect(result.page.parentId).toBe(otherId);
    });
  });

  describe('createPage', () => {
    const dto: CreatePageDto = {
      slug: 'new-page',
      title: 'New page',
      content: 'content',
      visibility: 'public',
    };

    it('creates the page and its first version', async () => {
      pagesRepository.findBySlugAndParent.mockResolvedValue(null);
      const created = {
        page: buildPage({ slug: 'new-page' }),
        version: buildVersion(),
      };
      pagesRepository.createWithFirstVersion.mockResolvedValue(created);

      const result = await service.createPage(dto, 'user-1');

      expect(pagesRepository.createWithFirstVersion).toHaveBeenCalledWith({
        slug: 'new-page',
        title: 'New page',
        content: 'content',
        parentId: null,
        visibility: 'public',
        createdById: 'user-1',
      });
      expect(result).toBe(created);
    });

    it('throws ValidationException for an invalid slug', async () => {
      await expect(
        service.createPage({ ...dto, slug: 'Invalid Slug!' }, 'user-1'),
      ).rejects.toBeInstanceOf(ValidationException);
      expect(pagesRepository.createWithFirstVersion).not.toHaveBeenCalled();
    });

    it('throws ParentPageNotFoundException when parentId does not resolve', async () => {
      pagesRepository.findById.mockResolvedValue(null);

      await expect(
        service.createPage({ ...dto, parentId: 'missing-parent' }, 'user-1'),
      ).rejects.toBeInstanceOf(ParentPageNotFoundException);
    });

    it('throws SlugAlreadyExistsException when the slug is already taken at that level', async () => {
      pagesRepository.findBySlugAndParent.mockResolvedValue(buildPage());

      await expect(service.createPage(dto, 'user-1')).rejects.toBeInstanceOf(
        SlugAlreadyExistsException,
      );
    });
  });

  describe('getTree', () => {
    it('returns every page for an admin/editor', async () => {
      const pages = [buildPage({ id: 'p1', visibility: 'private' })];
      pagesRepository.findAll.mockResolvedValue(pages);

      const tree = await service.getTree(editor);

      expect(tree).toHaveLength(1);
    });

    it('filters out private pages for a reader without an explicit grant', async () => {
      pagePermissionsService.canEdit.mockResolvedValue(false);
      const pages = [
        buildPage({ id: 'p1', visibility: 'private' }),
        buildPage({ id: 'p2', visibility: 'public' }),
      ];
      pagesRepository.findAll.mockResolvedValue(pages);

      const tree = await service.getTree(reader);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('p2');
    });

    it('includes a private page for a reader with an explicit permission grant', async () => {
      pagePermissionsService.canEdit.mockImplementation((_userId, pageId) =>
        Promise.resolve(pageId === 'p1'),
      );
      const pages = [
        buildPage({ id: 'p1', visibility: 'private' }),
        buildPage({ id: 'p2', visibility: 'private' }),
      ];
      pagesRepository.findAll.mockResolvedValue(pages);

      const tree = await service.getTree(reader);

      expect(tree.map((node) => node.id)).toEqual(['p1']);
    });
  });

  describe('findByPath', () => {
    it('resolves a page by its full ancestor slug path', async () => {
      const parent = buildPage({
        id: 'parent-1',
        slug: 'docs',
        parentId: null,
      });
      const child = buildPage({
        id: 'child-1',
        slug: 'guide',
        parentId: 'parent-1',
      });
      const version = buildVersion({ id: child.currentVersionId! });

      pagesRepository.findBySlugAndParent.mockImplementation(
        (slug: string, parentId: string | null) => {
          if (slug === 'docs' && parentId === null)
            return Promise.resolve(parent);
          if (slug === 'guide' && parentId === 'parent-1')
            return Promise.resolve(child);
          return Promise.resolve(null);
        },
      );
      pagesRepository.findVersionById.mockResolvedValue(version);

      const result = await service.findByPath(['docs', 'guide'], editor);

      expect(result.page).toBe(child);
      expect(result.version).toBe(version);
    });

    it('throws PageNotFoundException for an empty path', async () => {
      await expect(service.findByPath([], editor)).rejects.toBeInstanceOf(
        PageNotFoundException,
      );
    });

    it('throws PageAccessForbiddenException for a private page and no permission', async () => {
      const page = buildPage({ visibility: 'private' });
      pagePermissionsService.canEdit.mockResolvedValue(false);
      pagesRepository.findBySlugAndParent.mockResolvedValue(page);

      await expect(
        service.findByPath(['secret'], reader),
      ).rejects.toBeInstanceOf(PageAccessForbiddenException);
    });

    it('allows a private page for a reader with an explicit permission grant', async () => {
      const page = buildPage({ visibility: 'private' });
      const version = buildVersion({ id: page.currentVersionId! });
      pagePermissionsService.canEdit.mockResolvedValue(true);
      pagesRepository.findBySlugAndParent.mockResolvedValue(page);
      pagesRepository.findVersionById.mockResolvedValue(version);

      const result = await service.findByPath(['secret'], reader);

      expect(result.page).toBe(page);
    });

    it('increments the view count on each read', async () => {
      const page = buildPage({ viewCount: 4 });
      const version = buildVersion({ id: page.currentVersionId! });
      pagesRepository.findBySlugAndParent.mockResolvedValue(page);
      pagesRepository.findVersionById.mockResolvedValue(version);

      const result = await service.findByPath(['home'], editor);

      expect(pagesRepository.incrementViewCount).toHaveBeenCalledWith(page.id);
      expect(result.page.viewCount).toBe(5);
    });

    it('reports isFollowed for the current user', async () => {
      const page = buildPage();
      const version = buildVersion({ id: page.currentVersionId! });
      pagesRepository.findBySlugAndParent.mockResolvedValue(page);
      pagesRepository.findVersionById.mockResolvedValue(version);
      pageFollowRepository.isFollowing.mockResolvedValue(true);

      const result = await service.findByPath(['home'], editor);

      expect(pageFollowRepository.isFollowing).toHaveBeenCalledWith(
        editor.id,
        page.id,
      );
      expect(result.isFollowed).toBe(true);
    });

    it('reports isFollowed as false for an anonymous reader', async () => {
      const page = buildPage({ visibility: 'public' });
      const version = buildVersion({ id: page.currentVersionId! });
      pagesRepository.findBySlugAndParent.mockResolvedValue(page);
      pagesRepository.findVersionById.mockResolvedValue(version);

      const result = await service.findByPath(['home'], undefined);

      expect(pageFollowRepository.isFollowing).not.toHaveBeenCalled();
      expect(result.isFollowed).toBe(false);
    });
  });

  describe('listPopularPages', () => {
    it('returns the public pages with the most views', async () => {
      const pages = [buildPage({ id: 'page-1', viewCount: 10 })];
      pagesRepository.findTopPublicByViewCount.mockResolvedValue(pages);

      const result = await service.listPopularPages(5);

      expect(pagesRepository.findTopPublicByViewCount).toHaveBeenCalledWith(5);
      expect(result).toBe(pages);
    });
  });

  describe('listChildren / getByIdOrFail', () => {
    it('lists visible children: public always, private only with a grant', async () => {
      const parent = buildPage({ id: 'parent-1', visibility: 'public' });
      pagesRepository.findById.mockResolvedValue(parent);
      pagePermissionsService.canEdit.mockImplementation((_userId, pageId) =>
        Promise.resolve(pageId === 'c2'),
      );
      pagesRepository.findChildren.mockResolvedValue([
        buildPage({ id: 'c1', visibility: 'public' }),
        buildPage({ id: 'c2', visibility: 'private' }),
        buildPage({ id: 'c3', visibility: 'private' }),
      ]);

      const children = await service.listChildren('parent-1', reader);

      expect(children.map((c) => c.id)).toEqual(['c1', 'c2']);
    });

    it('throws PageNotFoundException when the parent does not exist', async () => {
      pagesRepository.findById.mockResolvedValue(null);

      await expect(
        service.listChildren('missing', reader),
      ).rejects.toBeInstanceOf(PageNotFoundException);
    });
  });

  describe('deletePage', () => {
    it('throws PageHasChildrenException when the page has children and cascade is not requested', async () => {
      pagesRepository.findById.mockResolvedValue(buildPage());
      pagesRepository.findChildren.mockResolvedValue([
        buildPage({ id: 'child' }),
      ]);

      await expect(
        service.deletePage('page-1', {}, 'user-1'),
      ).rejects.toBeInstanceOf(PageHasChildrenException);
      expect(pagesRepository.softDelete).not.toHaveBeenCalled();
    });

    it('deletes recursively when cascade=true', async () => {
      const parent = buildPage({ id: 'parent' });
      const child = buildPage({ id: 'child', parentId: 'parent' });

      pagesRepository.findById.mockImplementation((id: string) =>
        Promise.resolve(
          id === 'parent' ? parent : id === 'child' ? child : null,
        ),
      );
      pagesRepository.findChildren.mockImplementation((id: string) =>
        Promise.resolve(id === 'parent' ? [child] : []),
      );

      await service.deletePage('parent', { cascade: 'true' }, 'user-1');

      expect(pagesRepository.softDelete).toHaveBeenCalledWith('child');
      expect(pagesRepository.softDelete).toHaveBeenCalledWith('parent');
    });

    it('soft-deletes a leaf page without cascade', async () => {
      pagesRepository.findById.mockResolvedValue(buildPage({ id: 'leaf' }));
      pagesRepository.findChildren.mockResolvedValue([]);

      await service.deletePage('leaf', {}, 'user-1');

      expect(pagesRepository.softDelete).toHaveBeenCalledWith('leaf');
    });
  });

  describe('setVisibility', () => {
    it('emits PAGE_PUBLISHED_EVENT when a page becomes public', async () => {
      const page = buildPage({ visibility: 'private' });
      const version = buildVersion();
      const dto: ChangeVisibilityDto = { visibility: 'public' };

      pagesRepository.findById.mockResolvedValue(page);
      pagesRepository.findVersionById.mockResolvedValue(version);
      pagesRepository.updateVisibility.mockResolvedValue({
        ...page,
        visibility: 'public',
      });
      pagesRepository.findChildren.mockResolvedValue([]);

      await service.setVisibility('page-1', dto, 'user-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PAGE_PUBLISHED_EVENT,
        expect.objectContaining({ pageId: page.id }),
      );
    });

    it('does not emit an event when the page was already public', async () => {
      const page = buildPage({ visibility: 'public' });
      pagesRepository.findById.mockResolvedValue(page);
      pagesRepository.findVersionById.mockResolvedValue(buildVersion());
      pagesRepository.updateVisibility.mockResolvedValue(page);
      pagesRepository.findChildren.mockResolvedValue([]);

      await service.setVisibility('page-1', { visibility: 'public' }, 'user-1');

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('throws ValidationException for an invalid visibility value', async () => {
      await expect(
        service.setVisibility(
          'page-1',
          { visibility: 'invalid' } as unknown as ChangeVisibilityDto,
          'user-1',
        ),
      ).rejects.toBeInstanceOf(ValidationException);
    });
  });

  describe('setCommentsEnabled', () => {
    it('updates commentsEnabled on the page', async () => {
      const page = buildPage({ commentsEnabled: true });
      const version = buildVersion();
      const dto: SetCommentsEnabledDto = { commentsEnabled: false };

      pagesRepository.findById.mockResolvedValue(page);
      pagesRepository.findVersionById.mockResolvedValue(version);
      pagesRepository.updateCommentsEnabled.mockResolvedValue({
        ...page,
        commentsEnabled: false,
      });

      const result = await service.setCommentsEnabled('page-1', dto, 'user-1');

      expect(pagesRepository.updateCommentsEnabled).toHaveBeenCalledWith(
        page,
        false,
      );
      expect(result.page.commentsEnabled).toBe(false);
      expect(result.version).toBe(version);
    });

    it('throws PageNotFoundException when the page does not exist', async () => {
      pagesRepository.findById.mockResolvedValue(null);

      await expect(
        service.setCommentsEnabled(
          'missing',
          { commentsEnabled: false },
          'user-1',
        ),
      ).rejects.toBeInstanceOf(PageNotFoundException);
    });

    it('throws InsufficientPagePermissionException when the user cannot edit', async () => {
      pagesRepository.findById.mockResolvedValue(buildPage());
      pagePermissionsService.canEdit.mockResolvedValue(false);

      await expect(
        service.setCommentsEnabled(
          'page-1',
          { commentsEnabled: false },
          'user-2',
        ),
      ).rejects.toBeInstanceOf(InsufficientPagePermissionException);
      expect(pagesRepository.updateCommentsEnabled).not.toHaveBeenCalled();
    });

    it('throws ValidationException when commentsEnabled is not a boolean', async () => {
      await expect(
        service.setCommentsEnabled(
          'page-1',
          { commentsEnabled: 'no' } as unknown as SetCommentsEnabledDto,
          'user-1',
        ),
      ).rejects.toBeInstanceOf(ValidationException);
    });
  });

  describe('followPage', () => {
    it('follows an existing page', async () => {
      const page = buildPage();
      pagesRepository.findById.mockResolvedValue(page);

      await service.followPage(page.id, 'user-1');

      expect(pageFollowRepository.follow).toHaveBeenCalledWith(
        'user-1',
        page.id,
      );
    });

    it('throws PageNotFoundException for a missing page', async () => {
      pagesRepository.findById.mockResolvedValue(null);

      await expect(
        service.followPage('missing', 'user-1'),
      ).rejects.toBeInstanceOf(PageNotFoundException);
      expect(pageFollowRepository.follow).not.toHaveBeenCalled();
    });
  });

  describe('unfollowPage', () => {
    it('delegates to the repository', async () => {
      await service.unfollowPage('page-1', 'user-1');

      expect(pageFollowRepository.unfollow).toHaveBeenCalledWith(
        'user-1',
        'page-1',
      );
    });
  });

  describe('getFollowedPages', () => {
    it('returns followed pages with their last activity date, most recent first', async () => {
      const older = buildPage({ id: 'page-1', currentVersionId: 'v1' });
      const newer = buildPage({ id: 'page-2', currentVersionId: 'v2' });
      const olderVersion = buildVersion({
        id: 'v1',
        createdAt: new Date('2026-01-01'),
      });
      const newerVersion = buildVersion({
        id: 'v2',
        createdAt: new Date('2026-02-01'),
      });
      pageFollowRepository.findFollowedPageIds.mockResolvedValue([
        'page-1',
        'page-2',
      ]);
      pagesRepository.findById.mockImplementation((id: string) =>
        Promise.resolve(id === 'page-1' ? older : newer),
      );
      pagesRepository.findVersionById.mockImplementation((id: string) =>
        Promise.resolve(id === 'v1' ? olderVersion : newerVersion),
      );

      const result = await service.getFollowedPages('user-1');

      expect(result).toEqual([
        { page: newer, lastActivityAt: newerVersion.createdAt },
        { page: older, lastActivityAt: olderVersion.createdAt },
      ]);
    });

    it('returns an empty list when nothing is followed', async () => {
      pageFollowRepository.findFollowedPageIds.mockResolvedValue([]);

      const result = await service.getFollowedPages('user-1');

      expect(result).toEqual([]);
    });
  });
});
