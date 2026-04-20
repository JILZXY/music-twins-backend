import { Injectable, Inject } from '@nestjs/common';
import { FEED_REPOSITORY } from '../domain/feed.repository';
import type { FeedRepository } from '../domain/feed.repository';

@Injectable()
export class FeedService {
  constructor(@Inject(FEED_REPOSITORY) private readonly feedRepository: FeedRepository) {}
  
  async getFeed(userId: string, friendId?: string, limit: number = 20) {
    return this.feedRepository.getFeedItems(userId, friendId, limit);
  }
}
