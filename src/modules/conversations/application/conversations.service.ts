import { Injectable, Inject } from '@nestjs/common';
import { CONVERSATION_REPOSITORY } from '../domain/conversation.repository';
import type { ConversationRepository } from '../domain/conversation.repository';

@Injectable()
export class ConversationsService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly repo: ConversationRepository,
  ) {}

  async getConversations(userId: string) {
    const items = await this.repo.findByUserId(userId);
    return items.map((item) => ({
      id: item.conversationId,
      user: {
        id: item.userId,
        displayName: item.userDisplayName,
        avatarUrl: item.userAvatarUrl,
      },
      lastMessage: null,
      unreadCount: 0,
    }));
  }

  async createConversation(userId: string, targetUserId: string) {
    return this.repo.createOrFind(userId, targetUserId);
  }
}
