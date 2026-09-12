export interface UserCommentResponseDto {
  id: string;
  pageId: string;
  pagePath: string | null;
  content: string;
  deletedAt: Date | null;
  createdAt: Date;
}
