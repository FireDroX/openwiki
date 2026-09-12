import { ResponseDto } from '../../common/dto/response.dto.js';
import { CommentResponseDto } from '../dto/out/comment-response.dto.js';
import { Comment } from '../entities/comment.entity.js';

export class CommentMapper {
  static toResponseDto(
    comment: Comment,
    authorNames: Map<string, string>,
  ): CommentResponseDto {
    return {
      id: comment.id,
      pageId: comment.pageId,
      authorId: comment.authorId,
      authorDisplayName: authorNames.get(comment.authorId) ?? null,
      parentId: comment.parentId,
      content: comment.content,
      editedAt: comment.editedAt,
      deletedAt: comment.deletedAt,
      createdAt: comment.createdAt,
    };
  }

  static toTree(
    comments: Comment[],
    authorNames: Map<string, string>,
  ): CommentResponseDto[] {
    const topLevel = comments.filter((comment) => comment.parentId === null);
    return topLevel.map((comment) => ({
      ...CommentMapper.toResponseDto(comment, authorNames),
      replies: comments
        .filter((reply) => reply.parentId === comment.id)
        .map((reply) => CommentMapper.toResponseDto(reply, authorNames)),
    }));
  }

  static toTreeResponse(
    comments: Comment[],
    authorNames: Map<string, string>,
  ): ResponseDto<CommentResponseDto[]> {
    return new ResponseDto(CommentMapper.toTree(comments, authorNames));
  }
}
