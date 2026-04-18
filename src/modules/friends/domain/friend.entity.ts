export type FriendStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export class Friendship {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly friendId: string,
    public readonly status: FriendStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
