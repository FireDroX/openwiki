export class CommentEditForbiddenException extends Error {
  constructor() {
    super('You can only edit your own comments');
    this.name = 'CommentEditForbiddenException';
  }
}
