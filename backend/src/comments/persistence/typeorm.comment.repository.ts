import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity.js';
import { CommentsRepository, CreateCommentInput } from './comment.repository.js';

@Injectable()
export class TypeormCommentsRepository implements CommentsRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
  ) {}

  findById(id: string): Promise<Comment | null> {
    return this.repository.findOneBy({ id });
  }

  findAllByPageId(pageId: string): Promise<Comment[]> {
    return this.repository.find({
      where: { pageId },
      order: { createdAt: 'ASC' },
    });
  }

  findRepliesByParentId(parentId: string): Promise<Comment[]> {
    return this.repository.find({
      where: { parentId },
      order: { createdAt: 'ASC' },
    });
  }

  create(input: CreateCommentInput): Promise<Comment> {
    return this.repository.save(this.repository.create(input));
  }

  softDelete(comment: Comment): Promise<Comment> {
    const updated = this.repository.merge(comment, {
      content: '',
      deletedAt: new Date(),
    });
    return this.repository.save(updated);
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.repository.delete(ids);
  }
}
