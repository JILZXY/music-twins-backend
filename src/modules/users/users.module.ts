import { Module } from '@nestjs/common';
import { PostgresUserRepository } from './infrastructure/postgres-user.repository';
import { USER_REPOSITORY } from './domain/user.repository';
import { UsersController } from './presentation/users.controller';
import { UserSearchService } from './application/user-search.service';
@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PostgresUserRepository,
    },
    UserSearchService,
  ],
  exports: [USER_REPOSITORY, UserSearchService],
})
export class UsersModule {}
