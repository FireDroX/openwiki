import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';

const PWNED_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const SHA1_PREFIX_LENGTH = 5;

@Injectable()
export class PwnedPasswordService {
  private readonly logger = new Logger(PwnedPasswordService.name);

  async checkPassword(password: string): Promise<boolean> {
    const sha1 = createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();
    const prefix = sha1.slice(0, SHA1_PREFIX_LENGTH);
    const suffix = sha1.slice(SHA1_PREFIX_LENGTH);

    try {
      const response = await fetch(`${PWNED_RANGE_URL}${prefix}`);
      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }
      const body = await response.text();
      return body
        .split('\n')
        .some((line) => line.split(':')[0].trim() === suffix);
    } catch (error) {
      this.logger.error('Pwned Passwords lookup failed — failing open', error);
      return false;
    }
  }
}
