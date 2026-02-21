import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { IngestReadingDto } from './dto/ingest-reading.dto';

@Injectable()
export class IngestService {
  constructor(private readonly prisma: PrismaService) {}

  async ingest(deviceId: string, apiKey: string, dto: IngestReadingDto) {
    if (!deviceId || !apiKey) {
      throw new UnauthorizedException('Missing device credentials');
    }

    const scale = await this.prisma.scale.findUnique({
      where: { deviceId },
      include: { branch: true },
    });

    if (!scale || !scale.active) {
      throw new UnauthorizedException('Unknown or inactive device');
    }

    const validApiKey = await bcrypt.compare(apiKey, scale.apiKeyHash);
    if (!validApiKey) {
      throw new UnauthorizedException('Invalid device key');
    }

    const recordedAt = new Date(dto.timestamp);
    if (Number.isNaN(recordedAt.getTime())) {
      throw new UnprocessableEntityException('Invalid timestamp');
    }

    const reading = await this.prisma.weightReading.create({
      data: {
        branchId: scale.branchId,
        scaleId: scale.id,
        recordedAt,
        weight: dto.weight,
        battery: dto.battery,
        status: dto.status,
      },
    });

    return {
      accepted: true,
      readingId: reading.id,
      branchId: scale.branchId,
      deviceId: scale.deviceId,
    };
  }
}
