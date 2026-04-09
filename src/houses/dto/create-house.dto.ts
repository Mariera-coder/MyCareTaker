import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateHouseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  estateId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rentAmount!: number;
}
