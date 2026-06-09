import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";

/** The 42 extracted bill fields — all optional (partial extraction is valid). */
export class CreateBillDto {
  @IsOptional() @IsString() buildingId?: string;
  @IsOptional() @IsString() fileUrl?: string;

  @IsOptional() @IsString() consumerNumber?: string;
  @IsOptional() @IsString() consumerName?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() discom?: string;
  @IsOptional() @IsString() tariffCategory?: string;
  @IsOptional() @IsString() supplyVoltage?: string;
  @IsOptional() @IsNumber() sanctionedLoadKw?: number;
  @IsOptional() @IsNumber() contractDemandKva?: number;
  @IsOptional() @IsNumber() billingDemandKva?: number;
  @IsOptional() @IsNumber() maxDemandKva?: number;
  @IsOptional() @IsString() mdDateTime?: string;
  @IsOptional() @IsNumber() energyKwh?: number;
  @IsOptional() @IsNumber() reactiveKvarh?: number;
  @IsOptional() @IsNumber() apparentKvah?: number;
  @IsOptional() @IsNumber() powerFactor?: number;
  @IsOptional() @IsNumber() loadFactorPct?: number;
  @IsOptional() @IsNumber() fixedDemandCharges?: number;
  @IsOptional() @IsNumber() energyCharges?: number;
  @IsOptional() @IsNumber() wheelingCharges?: number;
  @IsOptional() @IsNumber() crossSubsidySurcharge?: number;
  @IsOptional() @IsNumber() additionalSurcharge?: number;
  @IsOptional() @IsNumber() pfPenaltyAmt?: number;
  @IsOptional() @IsNumber() pfPenaltyRatePct?: number;
  @IsOptional() @IsNumber() todPeakKwh?: number;
  @IsOptional() @IsNumber() todOffPeakKwh?: number;
  @IsOptional() @IsNumber() todNormalKwh?: number;
  @IsOptional() @IsNumber() todPeakRate?: number;
  @IsOptional() @IsNumber() todOffPeakRate?: number;
  @IsOptional() @IsNumber() todShoulderRate?: number;
  @IsOptional() @IsNumber() facFppca?: number;
  @IsOptional() @IsNumber() electricityDuty?: number;
  @IsOptional() @IsNumber() meterRent?: number;
  @IsOptional() @IsNumber() transformerLossPct?: number;
  @IsOptional() @IsNumber() arrears?: number;
  @IsOptional() @IsNumber() latePaymentSurcharge?: number;
  @IsOptional() @IsNumber() earlyPaymentRebate?: number;
  @IsOptional() @IsNumber() netMeteringCredit?: number;
  @IsOptional() @IsNumber() totalAmountDue?: number;
  @IsOptional() @IsString() billDate?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsInt() billingPeriodDays?: number;
  @IsOptional() @IsString() meterNumber?: string;
}
