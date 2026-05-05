import { IsNumber, Min } from 'class-validator';

export class UpdateEstateFinancialSettingsDto {
  @IsNumber()
  @Min(0)
  monthlyCaretakerDeduction!: number;
}
