import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { PendingRegistrationRole } from '@prisma/client';
import { Type } from 'class-transformer';

class RequestedEstateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  unitCount?: number;
}

export class CreatePendingRegistrationDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsEmail()
  @Matches(/@gmail\.com$/i, { message: 'Please provide a Gmail address' })
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(PendingRegistrationRole)
  role!: PendingRegistrationRole;

  @IsOptional()
  @IsString()
  estateOfInterest?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RequestedEstateDto)
  requestedEstates?: RequestedEstateDto[];

  @IsOptional()
  @IsString()
  message?: string;
}
