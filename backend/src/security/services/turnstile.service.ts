import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResponse {
  success: boolean;
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly secretKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('TURNSTILE_SECRET_KEY');
  }

  async verify(token: string, remoteIp?: string): Promise<boolean> {
    if (!this.secretKey) {
      this.logger.warn(
        'TURNSTILE_SECRET_KEY is not configured — skipping Turnstile verification',
      );
      return true;
    }

    if (!token) {
      return false;
    }

    const body = new URLSearchParams({
      secret: this.secretKey,
      response: token,
    });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }

    try {
      const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const result = (await response.json()) as TurnstileVerifyResponse;
      return result.success === true;
    } catch (error) {
      this.logger.error('Turnstile verification request failed', error);
      return false;
    }
  }
}
