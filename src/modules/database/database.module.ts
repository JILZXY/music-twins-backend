import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { MongoClient, Db } from 'mongodb';
export const PG_POOL = 'PG_POOL';
export const MONGO_DB = 'MONGO_DB';
@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
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
    {
      provide: MONGO_DB,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<Db> => {
        const uri = configService.get<string>('MONGO_URI')!;
        const dbName = configService.get<string>('MONGO_DATABASE')!;
        const client = new MongoClient(uri);
        await client.connect();
        return client.db(dbName);
      },
    },
  ],
  exports: [PG_POOL, MONGO_DB],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor() {}
  async onApplicationShutdown(signal?: string) {
  }
}
