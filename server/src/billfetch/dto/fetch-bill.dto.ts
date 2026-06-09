import { IsObject, IsOptional, IsString } from "class-validator";

export class FetchBillDto {
  @IsString() billerId!: string;
  /** Customer params (consumer/account number, etc.) — keyed per biller. */
  @IsOptional() @IsObject() params?: Record<string, string>;
}
