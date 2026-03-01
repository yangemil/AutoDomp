import { Module } from '@nestjs/common';
import { APIController } from './api.controller';
import { ViewController } from './view.controller';
import { DataModule } from '../data';
import { AIModule } from '../ai';
import { TestEngineModule } from '../test-engine';
import { ReportModule } from '../report';
import { TimerModule } from '../timer';
import { AuthModule } from '../auth';
import { PermissionsModule } from '../permissions';

@Module({
  imports: [
    AuthModule,
    PermissionsModule,
    DataModule, AIModule, TestEngineModule, ReportModule, TimerModule],
  controllers: [APIController, ViewController],
})
export class WebModule {}
