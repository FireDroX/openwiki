import { PageVersion } from '../entities/page-version.entity.js';
import { Page, PageVisibility } from '../entities/page.entity.js';

export interface CreatePageWithFirstVersionInput {
  slug: string;
  title: string;
  content: string;
  parentId: string | null;
  visibility: PageVisibility;
  createdById: string;
}

export interface UpdatePageWithNewVersionInput {
  page: Page;
  title: string;
  content: string;
  changeSummary: string | null;
  authorId: string;
}

export interface PagesRepository {
  findById(id: string): Promise<Page | null>;
  findBySlugAndParent(
    slug: string,
    parentId: string | null,
  ): Promise<Page | null>;
  findAll(): Promise<Page[]>;
  findVersionById(id: string): Promise<PageVersion | null>;
  createWithFirstVersion(
    input: CreatePageWithFirstVersionInput,
  ): Promise<{ page: Page; version: PageVersion }>;
  updateWithNewVersion(
    input: UpdatePageWithNewVersionInput,
  ): Promise<{ page: Page; version: PageVersion }>;
  updateParent(page: Page, newParentId: string | null): Promise<Page>;
  findChildren(parentId: string): Promise<Page[]>;
  softDelete(id: string): Promise<void>;
  updatePublishStatus(page: Page, isPublished: boolean): Promise<Page>;
  updateVisibility(page: Page, visibility: PageVisibility): Promise<Page>;
  updateCommentsEnabled(page: Page, commentsEnabled: boolean): Promise<Page>;
}
