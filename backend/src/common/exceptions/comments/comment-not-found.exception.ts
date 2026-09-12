export class CommentNotFoundException extends Error {
  constructor() {
    super('Comment not found');
    this.name = 'CommentNotFoundException';
  }
}
