import { IsNotEmpty, IsString } from 'class-validator';

export class DenyPendingRegistrationDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
