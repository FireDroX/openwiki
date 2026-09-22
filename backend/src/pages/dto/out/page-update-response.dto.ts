export interface PageUpdateResponseDto {
  id: string;
  slug: string;
  title: string;
  content: string;
  currentVersionId: string;
  updatedAt: Date;
  conflict: boolean;
  mergedContent?: string;
}
