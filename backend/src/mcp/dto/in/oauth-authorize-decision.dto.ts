export class OAuthAuthorizeDecisionDto {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state?: string;
  decision: 'allow' | 'deny';
}
