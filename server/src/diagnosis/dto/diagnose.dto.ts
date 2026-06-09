import { Type } from "class-transformer";
import { IsArray, IsString, ValidateNested } from "class-validator";

class FieldDto {
  @IsString() key!: string;
  @IsString() value!: string;
}

export class DiagnoseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDto)
  fields!: FieldDto[];
}
