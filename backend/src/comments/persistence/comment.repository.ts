import { Comment } from '../entities/comment.entity.js';

export interface CommentsRepository {
  findAllByPageId(pageId: string): Promise<Comment[]>;
}
