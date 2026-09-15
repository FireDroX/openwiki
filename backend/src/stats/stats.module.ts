import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from '../media/entities/attachment.entity.js';
import { Comment } from '../comments/entities/comment.entity.js';
import { Page } from '../pages/entities/page.entity.js';
import { User } from '../users/entities/user.entity.js';
import { TypeormStatsRepository } from './persistence/typeorm.stats.repository.js';
import { StatsController } from './stats.controller.js';
import { StatsService } from './services/stats.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Page, Comment, User, Attachment])],
  controllers: [StatsController],
  providers: [
    { provide: 'StatsRepository', useClass: TypeormStatsRepository },
    StatsService,
  ],
})
export class StatsModule {}
