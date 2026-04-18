import { Module } from '@nestjs/common';
import { FriendsController } from './presentation/friends.controller';
import { FriendsService } from './application/friends.service';
import { PostgresFriendRepository } from './infrastructure/postgres-friend.repository';
import { FRIEND_REPOSITORY } from './domain/friend.repository';

@Module({
  controllers: [FriendsController],
  providers: [
    FriendsService,
    {
      provide: FRIEND_REPOSITORY,
      useClass: PostgresFriendRepository,
    },
  ],
  exports: [FriendsService, FRIEND_REPOSITORY],
})
export class FriendsModule {}
