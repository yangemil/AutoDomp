import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { DataModule } from '../data';

@Module({
  imports: [DataModule],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
