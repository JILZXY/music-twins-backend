import { FeedItem } from './feed-item.entity';

export const FEED_REPOSITORY = 'FEED_REPOSITORY';

export interface FeedRepository {
  getFeedItems(userId: string, friendId?: string, limit?: number): Promise<{ items: FeedItem[]; nextCursor: string | null }>;
  getFriendsSummary(userId: string): Promise<any[]>;
}
