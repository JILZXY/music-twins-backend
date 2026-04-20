import { Conversation, ConversationListItem } from './conversation.entity';

export const CONVERSATION_REPOSITORY = 'CONVERSATION_REPOSITORY';

export interface ConversationRepository {
  createOrFind(user1Id: string, user2Id: string): Promise<Conversation>;
  findByUserId(userId: string): Promise<ConversationListItem[]>;
}
