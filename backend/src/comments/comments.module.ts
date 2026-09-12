import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module.js';
import { PagesModule } from '../pages/pages.module.js';
import { UsersModule } from '../users/users.module.js';
import {
  CommentController,
  PageCommentsController,
} from './comments.controller.js';
import { Comment } from './entities/comment.entity.js';
import { TypeormCommentsRepository } from './persistence/typeorm.comment.repository.js';
import { CommentsService } from './services/comments.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    PagesModule,
    UsersModule,
    AdminModule,
  ],
  controllers: [PageCommentsController, CommentController],
  providers: [
    { provide: 'CommentsRepository', useClass: TypeormCommentsRepository },
    CommentsService,
  ],
  exports: [CommentsService],
})
export class CommentsModule {}
