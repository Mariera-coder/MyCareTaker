import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateComplaintDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsUUID()
  houseId?: string;
}
