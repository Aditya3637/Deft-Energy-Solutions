import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class CorrectionItemDto {
  @IsString() fieldKey!: string;
  /** Value the model produced ("" if it found nothing for this field). */
  @IsString() extracted!: string;
  /** Model's confidence for the extracted value (0 if not found). */
  @IsNumber() extractedConfidence!: number;
  /** Value the user kept/entered after review. */
  @IsString() final!: string;
  /** True when final differs from extracted (a correction or a fill of a miss). */
  @IsBoolean() corrected!: boolean;
}

export class SubmitCorrectionsDto {
  @IsString() provider!: string; // anthropic | openai | bbps | bbps-demo
  @IsOptional() @IsString() model?: string;
  @IsString() source!: string; // vision | pdf-text | bbps | bbps-demo
  @IsOptional() @IsString() discom?: string;
  @IsInt() fieldsTotal!: number;
  @IsInt() fieldsFound!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CorrectionItemDto)
  corrections!: CorrectionItemDto[];
}
