export class OAuthRefreshTokenNotFoundException extends Error {
  constructor() {
    super('OAuth refresh token not found for this client');
    this.name = 'OAuthRefreshTokenNotFoundException';
  }
}
