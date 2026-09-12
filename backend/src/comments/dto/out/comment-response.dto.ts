export interface CommentResponseDto {
  id: string;
  pageId: string;
  authorId: string;
  authorDisplayName: string | null;
  parentId: string | null;
  content: string;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  replies?: CommentResponseDto[];
}
