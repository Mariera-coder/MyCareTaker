import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum OwnerReviewDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class OwnerReviewComplaintDto {
  @IsEnum(OwnerReviewDecision)
  decision!: OwnerReviewDecision;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  approvedCost?: number;

  @IsOptional()
  @IsString()
  ownerNotes?: string;
}
