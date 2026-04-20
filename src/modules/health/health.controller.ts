import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { PG_POOL, MONGO_DB } from '../database/database.module';
import { Pool } from 'pg';
import { Db } from 'mongodb';
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    @Inject(PG_POOL) private readonly pgPool: Pool,
    @Inject(MONGO_DB) private readonly mongoDb: Db,
  ) {}
  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      async () => {
        try {
          await this.pgPool.query('SELECT 1');
          return { postgres: { status: 'up' } };
        } catch (e) {
          return { postgres: { status: 'down', message: (e as Error).message } };
        }
      },
      async () => {
        try {
          await this.mongoDb.command({ ping: 1 });
          return { mongodb: { status: 'up' } };
        } catch (e) {
          return { mongodb: { status: 'down', message: (e as Error).message } };
        }
      },
    ]);
  }
}
