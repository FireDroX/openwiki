import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/strategies/jwt.strategy.js';
import { PagesService } from '../../pages/services/pages.service.js';
import { UsersService } from '../../users/services/users.service.js';
import { Comment } from '../entities/comment.entity.js';
import type { CommentsRepository } from '../persistence/comment.repository.js';

@Injectable()
export class CommentsService {
  constructor(
    @Inject('CommentsRepository')
    private readonly commentsRepository: CommentsRepository,
    private readonly pagesService: PagesService,
    private readonly usersService: UsersService,
  ) {}

  async findAllByPage(
    pageId: string,
    currentUser?: AuthenticatedUser,
  ): Promise<{ comments: Comment[]; authorNames: Map<string, string> }> {
    await this.pagesService.getByIdOrFail(pageId, currentUser);
    const comments = await this.commentsRepository.findAllByPageId(pageId);
    const authorNames = await this.resolveAuthorNames(comments);
    return { comments, authorNames };
  }

  private async resolveAuthorNames(
    comments: Comment[],
  ): Promise<Map<string, string>> {
    const uniqueAuthorIds = [...new Set(comments.map((c) => c.authorId))];
    const entries = await Promise.all(
      uniqueAuthorIds.map(async (authorId) => {
        try {
          const author = await this.usersService.findById(authorId);
          return [authorId, author.displayName] as const;
        } catch {
          return null;
        }
      }),
    );
    return new Map(
      entries.filter((entry): entry is [string, string] => entry !== null),
    );
  }
}
