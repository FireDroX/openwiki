export class AttachmentInUseException extends Error {
  constructor(pageTitles: string[]) {
    super(`Attachment is still referenced by: ${pageTitles.join(', ')}`);
    this.name = 'AttachmentInUseException';
  }
}
