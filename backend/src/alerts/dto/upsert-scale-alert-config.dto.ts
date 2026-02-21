import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpsertScaleAlertConfigDto {
  @IsOptional()
  @IsNumber()
  minWeight?: number;

  @IsOptional()
  @IsNumber()
  maxWeight?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  staleAfterMinutes?: number;
}
