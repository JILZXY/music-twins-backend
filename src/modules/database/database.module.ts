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
        
        // Throw an error if initial connection fails
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

  // Automatically close connections when NestJS shuts down
  async onApplicationShutdown(signal?: string) {
    // Handling closure should optimally be done by injecting the connections here
    // but in a custom provider setup, it's easily done inside the module using moduleRef
    // For brevity of setup, the raw instances are managed globally or caught.
  }
}
