import { Module, Global, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db } from 'mongodb';

export const MONGO_DB = 'MONGO_DB';

@Global()
@Module({
  providers: [
    {
      provide: MONGO_DB,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI')!;
        const dbName = configService.get<string>('MONGO_DATABASE');

        const client = new MongoClient(uri);
        await client.connect();

        return client.db(dbName);
      },
    },
  ],
  exports: [MONGO_DB],
})
export class MongoModule implements OnApplicationShutdown {
  constructor() {}
  async onApplicationShutdown(signal?: string) {}
}
