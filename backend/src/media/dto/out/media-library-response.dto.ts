import { AttachmentResponseDto } from './attachment-response.dto.js';

export interface MediaLibraryResponseDto {
  items: AttachmentResponseDto[];
  total: number;
}
