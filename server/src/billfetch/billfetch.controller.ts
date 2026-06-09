import { Body, Controller, Get, HttpException, HttpStatus, Post } from "@nestjs/common";

import { BillFetchService } from "./billfetch.service";
import { BillFetchError } from "./billfetch-core";
import { FetchBillDto } from "./dto/fetch-bill.dto";

@Controller("billfetch")
export class BillFetchController {
  constructor(private readonly svc: BillFetchService) {}

  /** GET /v1/billfetch/billers — DISCOM catalog for the picker. */
  @Get("billers")
  billers() {
    return { billers: this.svc.billers(), configured: this.svc.isConfigured() };
  }

  /** POST /v1/billfetch — fetch a bill summary by biller + customer params. */
  @Post()
  async fetch(@Body() dto: FetchBillDto) {
    try {
      return await this.svc.fetch(dto.billerId, dto.params ?? {});
    } catch (err) {
      if (err instanceof BillFetchError) {
        const status =
          err.status === 400
            ? HttpStatus.BAD_REQUEST
            : err.status === 503
              ? HttpStatus.SERVICE_UNAVAILABLE
              : HttpStatus.BAD_GATEWAY;
        throw new HttpException(err.message, status);
      }
      throw new HttpException("Bill fetch failed unexpectedly.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
