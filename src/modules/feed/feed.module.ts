import { Module } from '@nestjs/common';
import { FeedController } from './presentation/feed.controller';
import { FeedService } from './application/feed.service';
import { PostgresFeedRepository } from './infrastructure/postgres-feed.repository';
import { FEED_REPOSITORY } from './domain/feed.repository';

@Module({
  controllers: [FeedController],
  providers: [
    FeedService,
    {
      provide: FEED_REPOSITORY,
      useClass: PostgresFeedRepository,
    },
  ],
  exports: [FeedService, FEED_REPOSITORY],
})
export class FeedModule {}
