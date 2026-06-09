import { IsBoolean, IsIn, IsNumber, IsOptional, IsPositive, IsString, MinLength } from "class-validator";

export class CreateCollectionDto {
  @IsString() licenseId!: string;
  /** Links the collection to a tracked bill (marks it paid on the payments layer). */
  @IsOptional() @IsString() billId?: string;
  @IsOptional() @IsString() consumerNumber?: string;
  /** Amount collected from the consumer, in rupees. */
  @IsNumber() @IsPositive() amountInr!: number;
  /** True when recovering arrears (selects the split-commission rate). */
  @IsOptional() @IsBoolean() isOutstanding?: boolean;
  @IsIn(["CASH", "UPI", "CARD", "NETBANKING", "BBPS"]) method!: string;
  /** Caller-supplied key — guarantees no double-collect on retries. */
  @IsString() @MinLength(6) idempotencyKey!: string;
}
