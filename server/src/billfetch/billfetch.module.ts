import { Module } from "@nestjs/common";

import { BillFetchController } from "./billfetch.controller";
import { BillFetchService } from "./billfetch.service";

@Module({
  controllers: [BillFetchController],
  providers: [BillFetchService],
})
export class BillFetchModule {}
