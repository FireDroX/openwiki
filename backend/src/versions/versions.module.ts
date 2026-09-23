import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module.js';
import { PageVersion } from '../pages/entities/page-version.entity.js';
import { TypeormVersionsRepository } from './persistence/typeorm.version.repository.js';
import { VersionsService } from './services/versions.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PageVersion]),
    forwardRef(() => UsersModule),
  ],
  providers: [
    { provide: 'VersionsRepository', useClass: TypeormVersionsRepository },
    VersionsService,
  ],
  exports: [VersionsService],
})
export class VersionsModule {}
