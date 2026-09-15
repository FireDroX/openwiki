import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageFollow } from '../entities/page-follow.entity.js';
import { PageFollowRepository } from './page-follow.repository.js';

@Injectable()
export class TypeormPageFollowRepository implements PageFollowRepository {
  constructor(
    @InjectRepository(PageFollow)
    private readonly repository: Repository<PageFollow>,
  ) {}

  async follow(userId: string, pageId: string): Promise<void> {
    const existing = await this.repository.findOneBy({ userId, pageId });
    if (existing) {
      return;
    }
    await this.repository.save(this.repository.create({ userId, pageId }));
  }

  async unfollow(userId: string, pageId: string): Promise<void> {
    await this.repository.delete({ userId, pageId });
  }

  async findFollowedPageIds(userId: string): Promise<string[]> {
    const rows = await this.repository.find({
      where: { userId },
      select: { pageId: true },
    });
    return rows.map((row) => row.pageId);
  }
}
