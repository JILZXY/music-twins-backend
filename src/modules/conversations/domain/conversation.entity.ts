export class Conversation {
  constructor(
    public readonly id: string,
    public readonly user1Id: string,
    public readonly user2Id: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class ConversationListItem {
  constructor(
    public readonly conversationId: string,
    public readonly updatedAt: Date,
    public readonly userId: string,
    public readonly userDisplayName: string,
    public readonly userAvatarUrl: string | null,
  ) {}
}
