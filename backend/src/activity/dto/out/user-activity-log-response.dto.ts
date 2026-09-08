export interface UserActivityLogItemDto {
  id: string;
  userId: string;
  userDisplayName: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: Date;
}

export interface UserActivityLogListDto {
  items: UserActivityLogItemDto[];
  total: number;
}
