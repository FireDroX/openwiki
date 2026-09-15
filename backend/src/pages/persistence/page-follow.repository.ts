export interface PageFollowRepository {
  follow(userId: string, pageId: string): Promise<void>;
  unfollow(userId: string, pageId: string): Promise<void>;
  findFollowedPageIds(userId: string): Promise<string[]>;
}
