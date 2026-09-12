export interface AttachmentResponseDto {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  pageId: string | null;
}
