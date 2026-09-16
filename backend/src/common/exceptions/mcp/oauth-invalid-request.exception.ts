export class OAuthInvalidRequestException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OAuthInvalidRequestException';
  }
}
