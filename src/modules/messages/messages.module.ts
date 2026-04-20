import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagesGateway } from './presentation/messages.gateway';
import { MessagesRepository } from './infrastructure/messages.repository';
import { MessagesController } from './presentation/messages.controller';

@Module({
  imports: [AuthModule],
  controllers: [MessagesController],
  providers: [MessagesRepository, MessagesGateway],
  exports: [MessagesRepository],
})
export class MessagesModule {}
