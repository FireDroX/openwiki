import { PageVisibility } from '../../entities/page.entity.js';

export interface PageResponseDto {
  id: string;
  slug: string;
  title: string;
  parentId: string | null;
  visibility: PageVisibility;
  isPublished: boolean;
  commentsEnabled: boolean;
  currentVersion: {
    id: string;
    content: string;
  };
  createdAt: Date;
}
