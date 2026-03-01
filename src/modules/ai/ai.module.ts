import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { DataModule } from '../data';

@Module({
  imports: [DataModule],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
