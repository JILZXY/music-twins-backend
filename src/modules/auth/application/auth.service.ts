import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SpotifyService } from '../infrastructure/spotify.service';
import { USER_REPOSITORY } from '../../users/domain/user.repository';
import type { UserRepository } from '../../users/domain/user.repository';
import { STREAMING_ACCOUNT_REPOSITORY } from '../../streaming-accounts/domain/streaming-account.repository';
import type { StreamingAccountRepository } from '../../streaming-accounts/domain/streaming-account.repository';
import { User } from '../../users/domain/user.entity';
import { StreamingAccount } from '../../streaming-accounts/domain/streaming-account.entity';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class AuthService {
  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly jwtService: JwtService,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(STREAMING_ACCOUNT_REPOSITORY)
    private readonly streamingAccountRepository: StreamingAccountRepository,
  ) {}
  getSpotifyAuthUrl(state: string, codeChallenge: string): string {
    return this.spotifyService.getAuthorizationUrl(state, codeChallenge);
  }
  async handleSpotifyCallback(
    code: string,
    codeVerifier: string,
  ): Promise<{ accessToken: string; user: any }> {
    const tokenResponse = await this.spotifyService.exchangeCodeForToken(
      code,
      codeVerifier,
    );
    const profile = await this.spotifyService.getUserProfile(
      tokenResponse.access_token,
    );
    let streamingAccount =
      await this.streamingAccountRepository.findByProviderAccountId(profile.id);
    let user: User;
    if (streamingAccount) {
      user = (await this.userRepository.findById(
        streamingAccount.userId,
      )) as User;
      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      streamingAccount = new StreamingAccount(
        streamingAccount.id,
        user.id,
        'SPOTIFY',
        profile.id,
        tokenResponse.access_token,
        tokenResponse.refresh_token || streamingAccount.refreshToken,
        expiresAt,
        streamingAccount.createdAt,
        new Date(),
      );
      await this.streamingAccountRepository.save(streamingAccount);

      // Refresh user info
      const avatarUrl =
        profile.images && profile.images.length > 0
          ? profile.images[0].url
          : user.avatarUrl;
      const updatedUser = new User(
        user.id,
        user.spotifyId,
        profile.display_name || user.displayName,
        profile.email || user.email,
        avatarUrl,
        user.createdAt,
        new Date(),
      );
      await this.userRepository.save(updatedUser);
      user = updatedUser;
    } else {
      const userId = uuidv4();
      const avatarUrl =
        profile.images && profile.images.length > 0
          ? profile.images[0].url
          : null;
      user = new User(
        userId,
        profile.id,
        profile.display_name,
        profile.email,
        avatarUrl,
        new Date(),
        new Date(),
      );
      await this.userRepository.save(user);
      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      streamingAccount = new StreamingAccount(
        uuidv4(),
        user.id,
        'SPOTIFY',
        profile.id,
        tokenResponse.access_token,
        tokenResponse.refresh_token,
        expiresAt,
        new Date(),
        new Date(),
      );
      await this.streamingAccountRepository.save(streamingAccount);
    }
    const payload = { sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    };
  }
  async getMe(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;
    const streamingAccount =
      await this.streamingAccountRepository.findByUserId(userId);
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      hasSpotifyLinked: !!(
        streamingAccount && streamingAccount.provider === 'SPOTIFY'
      ),
    };
  }
}
