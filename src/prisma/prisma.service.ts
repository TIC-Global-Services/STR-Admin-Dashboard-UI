import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Create a connection pool (Prisma recommends this for production)
    const connectionString = process.env.DATABASE_URL!;

    const pool = new Pool({ connectionString });

    const adapter = new PrismaPg(pool);

    super({
      log: ['query', 'info', 'warn', 'error'],
      adapter, 
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}