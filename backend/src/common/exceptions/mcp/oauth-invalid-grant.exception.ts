export class OAuthInvalidGrantException extends Error {
  constructor(message = 'Invalid, expired or already used grant') {
    super(message);
    this.name = 'OAuthInvalidGrantException';
  }
}
