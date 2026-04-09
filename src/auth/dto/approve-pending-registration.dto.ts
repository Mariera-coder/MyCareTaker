import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ApprovePendingRegistrationDto {
  @IsOptional()
  @IsUUID()
  houseId?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  estateIds?: string[];

  @IsOptional()
  @IsString()
  email?: string;
}
