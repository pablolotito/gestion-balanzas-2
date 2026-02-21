import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class IngestReadingDto {
  @IsDateString()
  timestamp!: string;

  @IsNumber()
  weight!: number;

  @IsOptional()
  @IsNumber()
  battery?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
