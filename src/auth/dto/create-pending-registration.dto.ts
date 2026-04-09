import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { PendingRegistrationRole } from '@prisma/client';

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
  @IsString()
  message?: string;
}
