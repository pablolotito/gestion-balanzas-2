import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { AlertsService } from './alerts.service';
import { QueryAlertConfigDto } from './dto/query-alert-config.dto';
import { UpsertBranchAlertConfigDto } from './dto/upsert-branch-alert-config.dto';
import { UpsertScaleAlertConfigDto } from './dto/upsert-scale-alert-config.dto';

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.GLOBAL_MANAGER, Role.BRANCH_MANAGER)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('config')
  getConfig(@CurrentUser() user: JwtPayload, @Query() query: QueryAlertConfigDto) {
    return this.alertsService.getConfig(user, query);
  }

  @Put('config/branch/:branchId')
  upsertBranchConfig(
    @CurrentUser() user: JwtPayload,
    @Param('branchId') branchId: string,
    @Body() dto: UpsertBranchAlertConfigDto,
  ) {
    return this.alertsService.upsertBranchConfig(user, branchId, dto);
  }

  @Put('config/scale/:scaleId')
  upsertScaleConfig(
    @CurrentUser() user: JwtPayload,
    @Param('scaleId') scaleId: string,
    @Body() dto: UpsertScaleAlertConfigDto,
  ) {
    return this.alertsService.upsertScaleConfig(user, scaleId, dto);
  }

  @Delete('config/scale/:scaleId')
  deleteScaleConfig(@CurrentUser() user: JwtPayload, @Param('scaleId') scaleId: string) {
    return this.alertsService.deleteScaleConfig(user, scaleId);
  }
}
