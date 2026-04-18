import { Module } from '@nestjs/common';
import { SpotifyController } from './presentation/spotify.controller';
import { SpotifyPlaybackService } from './application/spotify-playback.service';
import { SpotifyAdapter } from './infrastructure/spotify.adapter';
import { MUSIC_PROVIDER_PORT } from './domain/music-provider.port';
import { StreamingAccountsModule } from '../streaming-accounts/streaming-accounts.module';

@Module({
  imports: [StreamingAccountsModule],
  controllers: [SpotifyController],
  providers: [
    SpotifyPlaybackService,
    {
      provide: MUSIC_PROVIDER_PORT,
      useClass: SpotifyAdapter,
    },
  ],
  exports: [SpotifyPlaybackService, MUSIC_PROVIDER_PORT],
})
export class SpotifyModule {}
