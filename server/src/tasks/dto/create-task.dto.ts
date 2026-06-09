import { IsIn, IsInt, IsOptional, IsString, MinLength } from "class-validator";

export class CreateTaskDto {
  @IsString() @MinLength(3) title!: string;
  @IsOptional() @IsString() building?: string;
  @IsOptional() @IsString() assignee?: string;
  @IsOptional() @IsString() due?: string; // DD-MM-YYYY
  @IsOptional() @IsInt() savingsInr?: number;
  @IsOptional() @IsIn(["HIGH", "MEDIUM", "LOW"]) priority?: string;
  @IsOptional() @IsIn(["DIAGNOSIS", "ALERT", "AUDIT"]) source?: string;
}
