import { IsInt, IsNumber, Min } from 'class-validator';

export class UpsertBranchAlertConfigDto {
  @IsNumber()
  minWeight!: number;

  @IsNumber()
  maxWeight!: number;

  @IsInt()
  @Min(1)
  staleAfterMinutes!: number;
}
