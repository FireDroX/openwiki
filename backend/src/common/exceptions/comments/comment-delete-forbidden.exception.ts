export class CommentDeleteForbiddenException extends Error {
  constructor() {
    super('You can only delete your own comments');
    this.name = 'CommentDeleteForbiddenException';
  }
}
