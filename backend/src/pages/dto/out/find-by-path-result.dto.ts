import { PageVersion } from '../../entities/page-version.entity.js';
import { Page } from '../../entities/page.entity.js';

export interface FindByPathResultDto {
  page: Page;
  version: PageVersion;
  isFollowed: boolean;
  canEdit: boolean;
}
