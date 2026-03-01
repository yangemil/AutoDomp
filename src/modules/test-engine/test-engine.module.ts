import { Module } from '@nestjs/common';
import { TestEngineService } from './test-engine.service';
import { DataModule } from '../data';
import { AIModule } from '../ai';
import { LoggingModule } from '../logging';  // 新增

@Module({
  imports: [DataModule, AIModule, LoggingModule],  // 新增 LoggingModule
  providers: [TestEngineService],
  exports: [TestEngineService],
})
export class TestEngineModule {}
