import { Module } from '@nestjs/common';
import { PostgresStreamingAccountRepository } from './infrastructure/postgres-streaming-account.repository';
import { STREAMING_ACCOUNT_REPOSITORY } from './domain/streaming-account.repository';
@Module({
  providers: [
    {
      provide: STREAMING_ACCOUNT_REPOSITORY,
      useClass: PostgresStreamingAccountRepository,
    },
  ],
  exports: [STREAMING_ACCOUNT_REPOSITORY],
})
export class StreamingAccountsModule {}
