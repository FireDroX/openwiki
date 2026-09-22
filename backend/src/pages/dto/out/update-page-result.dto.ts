import { PageVersion } from '../../entities/page-version.entity.js';
import { Page } from '../../entities/page.entity.js';

export interface UpdatePageResultDto {
  page: Page;
  version: PageVersion;
  conflict: boolean;
  mergedContent?: string;
}
