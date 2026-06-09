import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Run a unit of work with the tenant set for row-level security. The
   * `set_config(..., true)` is transaction-local, so RLS scopes every query
   * inside `fn` to `orgId`. See prisma/rls.sql.
   */
  async withOrg<T>(
    orgId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        "SELECT set_config('app.current_org', $1, true)",
        orgId,
      );
      return fn(tx);
    });
  }
}
