import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(user: JwtPayload) {
    if (user.role === Role.GLOBAL_MANAGER) {
      return this.prisma.branch.findMany({
        orderBy: { name: 'asc' },
      });
    }

    if (!user.branchIds.length) {
      throw new ForbiddenException('No branch access configured for this user');
    }

    return this.prisma.branch.findMany({
      where: { id: { in: user.branchIds } },
      orderBy: { name: 'asc' },
    });
  }
}
