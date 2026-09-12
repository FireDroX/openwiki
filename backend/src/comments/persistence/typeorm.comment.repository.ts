import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity.js';
import { CommentsRepository } from './comment.repository.js';

@Injectable()
export class TypeormCommentsRepository implements CommentsRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
  ) {}

  findAllByPageId(pageId: string): Promise<Comment[]> {
    return this.repository.find({
      where: { pageId },
      order: { createdAt: 'ASC' },
    });
  }
}
