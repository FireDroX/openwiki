export class OAuthInvalidClientException extends Error {
  constructor(message = 'Unknown or invalid OAuth client') {
    super(message);
    this.name = 'OAuthInvalidClientException';
  }
}
