import { Module } from '@nestjs/common';
import { PwnedPasswordService } from './services/pwned-password.service.js';
import { TurnstileService } from './services/turnstile.service.js';

@Module({
  providers: [TurnstileService, PwnedPasswordService],
  exports: [TurnstileService, PwnedPasswordService],
})
export class SecurityModule {}
