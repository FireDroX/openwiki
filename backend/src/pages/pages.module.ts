import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module.js';
import { CommentsModule } from '../comments/comments.module.js';
import { UsersModule } from '../users/users.module.js';
import { VersionsModule } from '../versions/versions.module.js';
import { PagePermission } from './entities/page-permission.entity.js';
import { PageVersion } from './entities/page-version.entity.js';
import { Page } from './entities/page.entity.js';
import { PagesController } from './pages.controller.js';
import { TypeormPagePermissionsRepository } from './persistence/typeorm.page-permission.repository.js';
import { TypeormPagesRepository } from './persistence/typeorm.page.repository.js';
import { PagePermissionsService } from './services/page-permissions.service.js';
import { PagesService } from './services/pages.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Page, PageVersion, PagePermission]),
    VersionsModule,
    UsersModule,
    ActivityModule,
    forwardRef(() => CommentsModule),
  ],
  controllers: [PagesController],
  providers: [
    { provide: 'PagesRepository', useClass: TypeormPagesRepository },
    {
      provide: 'PagePermissionsRepository',
      useClass: TypeormPagePermissionsRepository,
    },
    PagesService,
    PagePermissionsService,
  ],
  exports: [PagesService],
})
export class PagesModule {}
