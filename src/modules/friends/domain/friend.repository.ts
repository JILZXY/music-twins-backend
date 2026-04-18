import { Friendship } from './friend.entity';

export const FRIEND_REPOSITORY = 'FRIEND_REPOSITORY';

export interface FriendRepository {
  findById(id: string): Promise<Friendship | null>;
  findByUsers(userId1: string, userId2: string): Promise<Friendship | null>;
  findPendingRequests(userId: string): Promise<any[]>;
  findAcceptedFriends(userId: string): Promise<any[]>;
  save(friendship: Friendship): Promise<Friendship>;
}
