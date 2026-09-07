export class WeakPasswordException extends Error {
  constructor() {
    super(
      'Password must contain at least one uppercase letter, one digit and one special character',
    );
    this.name = 'WeakPasswordException';
  }
}
