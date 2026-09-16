export class OAuthAccessDeniedException extends Error {
  constructor(message = 'Only an admin account can authorize this client') {
    super(message);
    this.name = 'OAuthAccessDeniedException';
  }
}
