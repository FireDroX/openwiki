import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PagesModule } from '../pages/pages.module.js';
import { PagesGateway } from './pages.gateway.js';

@Module({
  imports: [JwtModule.register({}), PagesModule],
  providers: [PagesGateway],
})
export class RealtimeModule {}
