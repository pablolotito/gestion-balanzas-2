import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';
import { QueryComparisonDto } from './dto/query-comparison.dto';
import { QueryReadingsDto } from './dto/query-readings.dto';

@Injectable()
export class ReadingsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertBranchAccess(user: JwtPayload, branchId: string): void {
    if (user.role === Role.GLOBAL_MANAGER) {
      return;
    }

    if (!user.branchIds.includes(branchId)) {
      throw new ForbiddenException('No access to requested branch');
    }
  }

  async listReadings(user: JwtPayload, query: QueryReadingsDto) {
    this.assertBranchAccess(user, query.branchId);

    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 500) : 200;

    return this.prisma.weightReading.findMany({
      where: {
        branchId: query.branchId,
        recordedAt: {
          gte: new Date(query.from),
          lte: new Date(query.to),
        },
      },
      include: {
        scale: {
          select: {
            id: true,
            deviceId: true,
            label: true,
          },
        },
      },
      orderBy: {
        recordedAt: 'desc',
      },
      take: limit,
    });
  }

  async branchComparison(user: JwtPayload, query: QueryComparisonDto) {
    const where = {
      recordedAt: {
        gte: new Date(query.from),
        lte: new Date(query.to),
      },
      ...(user.role === Role.BRANCH_MANAGER
        ? {
            branchId: {
              in: user.branchIds,
            },
          }
        : {}),
    };

    const grouped = await this.prisma.weightReading.groupBy({
      by: ['branchId'],
      where,
      _count: {
        id: true,
      },
      _avg: {
        weight: true,
      },
      _max: {
        recordedAt: true,
      },
    });

    const branchIds = grouped.map((item) => item.branchId);
    const branches = await this.prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    const branchById = new Map(branches.map((branch) => [branch.id, branch]));

    return grouped
      .map((item) => {
        const branch = branchById.get(item.branchId);
        if (!branch) {
          return null;
        }

        return {
          branchId: branch.id,
          branchCode: branch.code,
          branchName: branch.name,
          averageWeight: item._avg.weight ?? 0,
          readingsCount: item._count.id,
          latestRecordedAt: item._max.recordedAt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.averageWeight - a.averageWeight);
  }
}
