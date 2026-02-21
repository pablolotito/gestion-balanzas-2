import { IsString } from 'class-validator';

export class QueryAlertConfigDto {
  @IsString()
  branchId!: string;
}
