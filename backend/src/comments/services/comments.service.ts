import { Inject, Injectable } from '@nestjs/common';
import { AdminAuditLogService } from '../../admin/services/admin-audit-log.service.js';
import { CommentDeleteForbiddenException } from '../../common/exceptions/comments/comment-delete-forbidden.exception.js';
import { CommentEditForbiddenException } from '../../common/exceptions/comments/comment-edit-forbidden.exception.js';
import { CommentNotFoundException } from '../../common/exceptions/comments/comment-not-found.exception.js';
import { ReplyNestingException } from '../../common/exceptions/comments/reply-nesting.exception.js';
import { ValidationException } from '../../common/exceptions/validation.exception.js';
import type { AuthenticatedUser } from '../../common/strategies/jwt.strategy.js';
import {
  COMMENT_CONTENT_MAX_LENGTH,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../../common/variables.global.js';
import { PagesService } from '../../pages/services/pages.service.js';
import { UsersService } from '../../users/services/users.service.js';
import { CreateCommentDto } from '../dto/in/create-comment.dto.js';
import { ListUserCommentsQueryDto } from '../dto/in/list-user-comments-query.dto.js';
import { PurgeCommentsDto } from '../dto/in/purge-comments.dto.js';
import { UpdateCommentDto } from '../dto/in/update-comment.dto.js';
import { Comment } from '../entities/comment.entity.js';
import type { CommentsRepository } from '../persistence/comment.repository.js';

export interface UserCommentsPage {
  items: Array<{ comment: Comment; pagePath: string | null }>;
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class CommentsService {
  constructor(
    @Inject('CommentsRepository')
    private readonly commentsRepository: CommentsRepository,
    private readonly pagesService: PagesService,
    private readonly usersService: UsersService,
    private readonly adminAuditLogService: AdminAuditLogService,
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

  async updateComment(
    id: string,
    dto: UpdateCommentDto,
    currentUser: AuthenticatedUser,
  ): Promise<{ comment: Comment; authorNames: Map<string, string> }> {
    const comment = await this.getByIdOrFail(id);
    if (comment.authorId !== currentUser.id) {
      throw new CommentEditForbiddenException();
    }
    this.validateContent(dto.content);
    const updated = await this.commentsRepository.updateContent(
      comment,
      dto.content,
      new Date(),
    );
    const authorNames = await this.resolveAuthorNames([updated]);
    return { comment: updated, authorNames };
  }

  async deleteComment(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    const comment = await this.getByIdOrFail(id);
    const isAuthor = comment.authorId === currentUser.id;
    const isModerator =
      currentUser.role === 'editor' || currentUser.role === 'admin';

    if (isAuthor) {
      await this.commentsRepository.softDelete(comment);
      return;
    }

    if (!isModerator) {
      throw new CommentDeleteForbiddenException();
    }

    const deletedIds = await this.hardDeleteWithReplies(comment);

    if (currentUser.role === 'admin') {
      await this.adminAuditLogService.record({
        adminId: currentUser.id,
        action: 'comment.deleted_by_admin',
        targetType: 'Comment',
        targetId: comment.id,
        metadata: { count: deletedIds.length, ids: deletedIds },
      });
    }
  }

  async listByUser(
    userId: string,
    query: ListUserCommentsQueryDto,
    admin: AuthenticatedUser,
  ): Promise<UserCommentsPage> {
    await this.usersService.findById(userId);

    const page = CommentsService.parsePage(query.page);
    const limit = CommentsService.parseLimit(query.limit);
    const { items, total } = await this.commentsRepository.findAllByAuthorId(
      userId,
      page,
      limit,
    );

    const withPagePath = await Promise.all(
      items.map(async (comment) => ({
        comment,
        pagePath: await this.resolvePagePath(comment.pageId, admin),
      })),
    );

    return { items: withPagePath, total, page, limit };
  }

  async purgeByUser(
    userId: string,
    dto: PurgeCommentsDto,
    admin: AuthenticatedUser,
  ): Promise<number> {
    await this.usersService.findById(userId);

    const topLevelIds = dto.commentIds
      ? (
          await this.commentsRepository.findByIdsAndAuthorId(
            dto.commentIds,
            userId,
          )
        ).map((comment) => comment.id)
      : await this.commentsRepository.findAllIdsByAuthorId(userId);

    const replyLists = await Promise.all(
      topLevelIds.map((id) =>
        this.commentsRepository.findRepliesByParentId(id),
      ),
    );
    const allIds = [
      ...topLevelIds,
      ...replyLists.flat().map((reply) => reply.id),
    ];
    const uniqueIds = [...new Set(allIds)];

    if (uniqueIds.length === 0) {
      return 0;
    }

    await this.commentsRepository.deleteMany(uniqueIds);
    await this.adminAuditLogService.record({
      adminId: admin.id,
      action: 'comment.purged_by_admin',
      targetType: 'User',
      targetId: userId,
      metadata: { count: uniqueIds.length, ids: uniqueIds },
    });

    return uniqueIds.length;
  }

  private async resolvePagePath(
    pageId: string,
    admin: AuthenticatedUser,
  ): Promise<string | null> {
    try {
      const page = await this.pagesService.getByIdOrFail(pageId, admin);
      return await this.pagesService.getAncestorPath(page);
    } catch {
      return null;
    }
  }

  private static parsePage(raw?: string): number {
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE;
  }

  private static parseLimit(raw?: string): number {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return DEFAULT_LIMIT;
    }
    return Math.min(parsed, MAX_LIMIT);
  }

  private async getByIdOrFail(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findById(id);
    if (!comment) {
      throw new CommentNotFoundException();
    }
    return comment;
  }

  private async hardDeleteWithReplies(comment: Comment): Promise<string[]> {
    const replies =
      comment.parentId === null
        ? await this.commentsRepository.findRepliesByParentId(comment.id)
        : [];
    const ids = [comment.id, ...replies.map((reply) => reply.id)];
    await this.commentsRepository.deleteMany(ids);
    return ids;
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
