import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { FRIEND_REPOSITORY } from '../domain/friend.repository';
import type { FriendRepository } from '../domain/friend.repository';
import { Friendship } from '../domain/friend.entity';

@Injectable()
export class FriendsService {
  constructor(
    @Inject(FRIEND_REPOSITORY) private readonly friendRepository: FriendRepository,
  ) {}

  async getPendingRequests(userId: string) {
    return this.friendRepository.findPendingRequests(userId);
  }

  async getFriends(userId: string) {
    return this.friendRepository.findAcceptedFriends(userId);
  }

  async sendRequest(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const existing = await this.friendRepository.findByUsers(userId, targetUserId);
    if (existing) {
      throw new BadRequestException('Friendship or pending request already exists');
    }

    const friendship = new Friendship(
      uuidv4(),
      userId,
      targetUserId,
      'PENDING',
      new Date(),
      new Date(),
    );

    await this.friendRepository.save(friendship);
    return { success: true, status: 'PENDING' };
  }

  async respondToRequest(userId: string, requestId: string, action: 'ACCEPT' | 'REJECT') {
    const friendship = await this.friendRepository.findById(requestId);
    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendship.friendId !== userId || friendship.status !== 'PENDING') {
      throw new BadRequestException('Invalid request');
    }

    const newFriendship = new Friendship(
      friendship.id,
      friendship.userId,
      friendship.friendId,
      action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
      friendship.createdAt,
      new Date(),
    );

    await this.friendRepository.save(newFriendship);
    return { success: true, status: newFriendship.status };
  }
}
