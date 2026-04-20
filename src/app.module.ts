import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostgresModule } from './shared/infrastructure/database/postgres/postgres.module';
import { MongoModule } from './shared/infrastructure/database/mongo/mongo.module';
import { HealthModule } from './modules/health/health.module';
import { validateEnv } from './shared/config/env.config';
import { GlobalExceptionFilter } from './shared/presentation/filters/global-exception.filter';
import { AuthModule } from './modules/auth/auth.module';
import { SpotifyModule } from './modules/spotify/spotify.module';
import { UsersModule } from './modules/users/users.module';
import { FriendsModule } from './modules/friends/friends.module';
import { PlaybackModule } from './modules/playback/playback.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { NotesModule } from './modules/notes/notes.module';
import { FeedModule } from './modules/feed/feed.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { StreamingAccountsModule } from './modules/streaming-accounts/streaming-accounts.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PostgresModule,
    MongoModule,
    HealthModule,
    UsersModule,
    StreamingAccountsModule,
    AuthModule,
    SpotifyModule,
    FriendsModule,
    PlaybackModule,
    ReactionsModule,
    NotesModule,
    FeedModule,
    ConversationsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
