export class OAuthTokenRequestDto {
  grant_type: string;
  code?: string;
  redirect_uri?: string;
  code_verifier?: string;
  refresh_token?: string;
  client_id: string;
  client_secret: string;
}

export class OAuthRevokeRequestDto {
  token: string;
  client_id: string;
  client_secret: string;
}
