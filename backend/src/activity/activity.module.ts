import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogController } from './activity-log.controller.js';
import { UserActivityLog } from './entities/user-activity-log.entity.js';
import { TypeormUserActivityLogRepository } from './persistence/typeorm.user-activity-log.repository.js';
import { UserActivityLogService } from './services/user-activity-log.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserActivityLog])],
  controllers: [ActivityLogController],
  providers: [
    {
      provide: 'UserActivityLogsRepository',
      useClass: TypeormUserActivityLogRepository,
    },
    UserActivityLogService,
  ],
  exports: [UserActivityLogService],
})
export class ActivityModule {}
