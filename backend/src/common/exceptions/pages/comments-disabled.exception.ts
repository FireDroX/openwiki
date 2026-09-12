export class CommentsDisabledException extends Error {
  constructor() {
    super('Comments are disabled on this page');
    this.name = 'CommentsDisabledException';
  }
}
