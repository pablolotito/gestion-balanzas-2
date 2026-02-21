import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { QueryComparisonDto } from './dto/query-comparison.dto';
import { QueryReadingsDto } from './dto/query-readings.dto';
import { ReadingsService } from './readings.service';

@Controller('readings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.GLOBAL_MANAGER, Role.BRANCH_MANAGER)
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: QueryReadingsDto) {
    return this.readingsService.listReadings(user, query);
  }

  @Get('comparison')
  comparison(@CurrentUser() user: JwtPayload, @Query() query: QueryComparisonDto) {
    return this.readingsService.branchComparison(user, query);
  }
}
