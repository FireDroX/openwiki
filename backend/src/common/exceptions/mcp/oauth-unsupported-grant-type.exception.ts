export class OAuthUnsupportedGrantTypeException extends Error {
  constructor(message = 'Unsupported grant_type') {
    super(message);
    this.name = 'OAuthUnsupportedGrantTypeException';
  }
}
