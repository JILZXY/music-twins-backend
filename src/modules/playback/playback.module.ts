import { Module } from '@nestjs/common';
import { PlaybackController } from './presentation/playback.controller';
import { PostgresPlaybackRepository, PLAYBACK_REPOSITORY } from './infrastructure/postgres-playback.repository';
@Module({
  controllers: [PlaybackController],
  providers: [
    {
      provide: PLAYBACK_REPOSITORY,
      useClass: PostgresPlaybackRepository,
    },
  ],
  exports: [PLAYBACK_REPOSITORY],
})
export class PlaybackModule {}
