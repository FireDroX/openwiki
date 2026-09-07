import { Module } from '@nestjs/common';
import { TurnstileService } from './services/turnstile.service.js';

@Module({
  providers: [TurnstileService],
  exports: [TurnstileService],
})
export class SecurityModule {}
