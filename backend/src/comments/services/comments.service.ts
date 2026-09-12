import { Inject, Injectable } from '@nestjs/common';
import { CommentNotFoundException } from '../../common/exceptions/comments/comment-not-found.exception.js';
import { ReplyNestingException } from '../../common/exceptions/comments/reply-nesting.exception.js';
import { ValidationException } from '../../common/exceptions/validation.exception.js';
import type { AuthenticatedUser } from '../../common/strategies/jwt.strategy.js';
import { COMMENT_CONTENT_MAX_LENGTH } from '../../common/variables.global.js';
import { PagesService } from '../../pages/services/pages.service.js';
import { UsersService } from '../../users/services/users.service.js';
import { CreateCommentDto } from '../dto/in/create-comment.dto.js';
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

  async createComment(
    pageId: string,
    dto: CreateCommentDto,
    currentUser: AuthenticatedUser,
  ): Promise<{ comment: Comment; authorNames: Map<string, string> }> {
    await this.pagesService.getByIdOrFail(pageId, currentUser);
    this.validateContent(dto.content);

    const parentId = dto.parentId ?? null;
    if (parentId !== null) {
      const parent = await this.commentsRepository.findById(parentId);
      if (!parent || parent.pageId !== pageId) {
        throw new CommentNotFoundException();
      }
      if (parent.parentId !== null) {
        throw new ReplyNestingException();
      }
    }

    const comment = await this.commentsRepository.create({
      pageId,
      authorId: currentUser.id,
      parentId,
      content: dto.content,
    });
    const authorNames = await this.resolveAuthorNames([comment]);
    return { comment, authorNames };
  }

  private validateContent(content: string): void {
    if (!content || content.length > COMMENT_CONTENT_MAX_LENGTH) {
      throw new ValidationException(
        `content must be longer than or equal to 1 and shorter than or equal to ${COMMENT_CONTENT_MAX_LENGTH} characters`,
      );
    }
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
