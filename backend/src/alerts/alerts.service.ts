import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';
import { QueryAlertConfigDto } from './dto/query-alert-config.dto';
import { UpsertBranchAlertConfigDto } from './dto/upsert-branch-alert-config.dto';
import { UpsertScaleAlertConfigDto } from './dto/upsert-scale-alert-config.dto';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertBranchAccess(user: JwtPayload, branchId: string): void {
    if (user.role === Role.GLOBAL_MANAGER) {
      return;
    }

    if (!user.branchIds.includes(branchId)) {
      throw new ForbiddenException('No access to requested branch');
    }
  }

  async getConfig(user: JwtPayload, query: QueryAlertConfigDto) {
    this.assertBranchAccess(user, query.branchId);

    const branch = await this.prisma.branch.findUnique({
      where: { id: query.branchId },
      include: {
        alertConfig: true,
        scales: {
          include: {
            alertConfig: true,
          },
          orderBy: { label: 'asc' },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        code: branch.code,
      },
      branchConfig: branch.alertConfig ?? {
        branchId: branch.id,
        minWeight: 0.2,
        maxWeight: 25,
        staleAfterMinutes: 30,
      },
      scaleConfigs: branch.scales.map((scale) => ({
        scale: {
          id: scale.id,
          deviceId: scale.deviceId,
          label: scale.label,
        },
        config: scale.alertConfig,
      })),
    };
  }

  async upsertBranchConfig(
    user: JwtPayload,
    branchId: string,
    dto: UpsertBranchAlertConfigDto,
  ) {
    this.assertBranchAccess(user, branchId);

    if (dto.minWeight >= dto.maxWeight) {
      throw new BadRequestException('minWeight must be lower than maxWeight');
    }

    await this.prisma.branch.findUniqueOrThrow({ where: { id: branchId } });

    return this.prisma.branchAlertConfig.upsert({
      where: { branchId },
      update: {
        minWeight: dto.minWeight,
        maxWeight: dto.maxWeight,
        staleAfterMinutes: dto.staleAfterMinutes,
      },
      create: {
        branchId,
        minWeight: dto.minWeight,
        maxWeight: dto.maxWeight,
        staleAfterMinutes: dto.staleAfterMinutes,
      },
    });
  }

  async upsertScaleConfig(user: JwtPayload, scaleId: string, dto: UpsertScaleAlertConfigDto) {
    const scale = await this.prisma.scale.findUnique({ where: { id: scaleId } });

    if (!scale) {
      throw new NotFoundException('Scale not found');
    }

    this.assertBranchAccess(user, scale.branchId);

    if (
      dto.minWeight !== undefined &&
      dto.maxWeight !== undefined &&
      dto.minWeight >= dto.maxWeight
    ) {
      throw new BadRequestException('minWeight must be lower than maxWeight');
    }

    return this.prisma.scaleAlertConfig.upsert({
      where: { scaleId },
      update: {
        minWeight: dto.minWeight,
        maxWeight: dto.maxWeight,
        staleAfterMinutes: dto.staleAfterMinutes,
      },
      create: {
        scaleId,
        minWeight: dto.minWeight,
        maxWeight: dto.maxWeight,
        staleAfterMinutes: dto.staleAfterMinutes,
      },
    });
  }

  async deleteScaleConfig(user: JwtPayload, scaleId: string) {
    const scale = await this.prisma.scale.findUnique({ where: { id: scaleId } });

    if (!scale) {
      throw new NotFoundException('Scale not found');
    }

    this.assertBranchAccess(user, scale.branchId);

    await this.prisma.scaleAlertConfig.deleteMany({ where: { scaleId } });
    return { deleted: true };
  }
}
