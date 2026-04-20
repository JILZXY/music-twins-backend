import { Module } from '@nestjs/common';
import { ConversationsController } from './presentation/conversations.controller';
import { ConversationsService } from './application/conversations.service';
import { PostgresConversationRepository } from './infrastructure/postgres-conversation.repository';
import { CONVERSATION_REPOSITORY } from './domain/conversation.repository';

@Module({
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: PostgresConversationRepository,
    },
  ],
  exports: [ConversationsService, CONVERSATION_REPOSITORY],
})
export class ConversationsModule {}
