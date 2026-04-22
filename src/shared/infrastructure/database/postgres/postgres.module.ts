import { Module, Global, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const pool = new Pool({
          host: configService.get<string>('PG_HOST'),
          port: configService.get<number>('PG_PORT'),
          user: configService.get<string>('PG_USER'),
          password: configService.get<string>('PG_PASSWORD'),
          database: configService.get<string>('PG_DATABASE'),
        });
        pool.on('error', (err) => {
          console.error('Unexpected error on idle PG client', err);
        });
        return pool;
      },
    },
  ],
  exports: [PG_POOL],
})
export class PostgresModule implements OnApplicationShutdown {
  constructor() {}
  async onApplicationShutdown(signal?: string) {}
}
