import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './presentation/auth.controller';
import { AuthService } from './application/auth.service';
import { SpotifyService } from './infrastructure/spotify.service';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { StreamingAccountsModule } from '../streaming-accounts/streaming-accounts.module';
@Module({
  imports: [
    UsersModule,
    StreamingAccountsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') || 'defaultSecretForDevOnly',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SpotifyService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
