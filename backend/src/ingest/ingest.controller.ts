import { Body, Controller, Headers, Post } from '@nestjs/common';
import { IngestReadingDto } from './dto/ingest-reading.dto';
import { IngestService } from './ingest.service';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post('weight')
  ingestWeight(
    @Headers('x-device-id') deviceId: string,
    @Headers('x-device-key') apiKey: string,
    @Body() dto: IngestReadingDto,
  ) {
    return this.ingestService.ingest(deviceId, apiKey, dto);
  }
}
