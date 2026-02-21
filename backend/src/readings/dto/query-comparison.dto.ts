import { IsDateString } from 'class-validator';

export class QueryComparisonDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
