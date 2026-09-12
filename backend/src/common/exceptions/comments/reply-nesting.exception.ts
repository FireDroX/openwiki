export class ReplyNestingException extends Error {
  constructor() {
    super('Replies can only be one level deep');
    this.name = 'ReplyNestingException';
  }
}
