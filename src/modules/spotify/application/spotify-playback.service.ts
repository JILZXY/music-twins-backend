import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { MUSIC_PROVIDER_PORT } from '../domain/music-provider.port';
import type { MusicProviderPort, Track } from '../domain/music-provider.port';
import { STREAMING_ACCOUNT_REPOSITORY } from '../../streaming-accounts/domain/streaming-account.repository';
import type { StreamingAccountRepository } from '../../streaming-accounts/domain/streaming-account.repository';
import { StreamingAccount } from '../../streaming-accounts/domain/streaming-account.entity';
@Injectable()
export class SpotifyPlaybackService {
  constructor(
    @Inject(MUSIC_PROVIDER_PORT) private readonly musicProviderPort: MusicProviderPort,
    @Inject(STREAMING_ACCOUNT_REPOSITORY) private readonly streamingAccountRepository: StreamingAccountRepository,
  ) {}
  private async getValidToken(userId: string): Promise<StreamingAccount> {
    const account = await this.streamingAccountRepository.findByUserId(userId);
    if (!account) {
      throw new UnauthorizedException('No streaming account linked');
    }
    if (account.expiresAt && account.expiresAt.getTime() <= Date.now() + 60000) {
      if (!account.refreshToken) {
        throw new UnauthorizedException('Token expired and no refresh token available');
      }
      const refreshed = await this.musicProviderPort.refreshToken(account.refreshToken);
      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
      const newAccount = new StreamingAccount(
        account.id,
        account.userId,
        account.provider,
        account.providerAccountId,
        refreshed.access_token,
        refreshed.refresh_token || account.refreshToken,
        newExpiresAt,
        account.createdAt,
        new Date(),
      );
      await this.streamingAccountRepository.save(newAccount);
      return newAccount;
    }
    return account;
  }
  async getNowPlaying(userId: string): Promise<Track | null> {
    try {
      const account = await this.getValidToken(userId);
      return await this.musicProviderPort.getNowPlaying(account.accessToken);
    } catch (e: any) {
      throw new UnauthorizedException(`Failed to get playback: ${e.message}`);
    }
  }
  async getRecentlyPlayed(userId: string, limit?: number): Promise<Track[]> {
     try {
      const account = await this.getValidToken(userId);
      return await this.musicProviderPort.getRecentlyPlayed(account.accessToken, limit || 20);
    } catch (e: any) {
      throw new UnauthorizedException(`Failed to get recent tracks: ${e.message}`);
    }
  }
}
