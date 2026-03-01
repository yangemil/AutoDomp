import { Module } from '@nestjs/common';
import { DataModule } from '../data';
import { TimerService } from './timer.service';
import { TestEngineModule } from '../test-engine';
import { NotificationModule } from '../notification';
import { ReportModule } from '../report';

@Module({
  imports: [DataModule, TestEngineModule, NotificationModule, ReportModule],
  providers: [TimerService],
  exports: [TimerService],
})
export class TimerModule {}
