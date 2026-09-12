import { PageVisibility } from '../../entities/page.entity.js';

export interface PageDetailResponseDto {
  id: string;
  slug: string;
  title: string;
  content: string;
  visibility: PageVisibility;
  isPublished: boolean;
  commentsEnabled: boolean;
  parentId: string | null;
  updatedAt: Date;
}
