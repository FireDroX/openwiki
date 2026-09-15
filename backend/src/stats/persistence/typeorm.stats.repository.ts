import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Attachment } from '../../media/entities/attachment.entity.js';
import { Comment } from '../../comments/entities/comment.entity.js';
import { Page } from '../../pages/entities/page.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { StatsRepository } from './stats.repository.js';

@Injectable()
export class TypeormStatsRepository implements StatsRepository {
  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
  ) {}

  countPages(): Promise<number> {
    return this.pageRepository.count();
  }

  countComments(): Promise<number> {
    return this.commentRepository.count({ where: { deletedAt: IsNull() } });
  }

  countUsers(): Promise<number> {
    return this.userRepository.count();
  }

  countMedia(): Promise<number> {
    return this.attachmentRepository.count();
  }
}
