export class Message {
  constructor(
    public readonly id: string, 
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly receiverId: string,
    public readonly content: string,
    public readonly playbackEventId: string | null,
    public readonly read: boolean,
    public readonly readAt: Date | null,
    public readonly createdAt: Date,
  ) {}
}
