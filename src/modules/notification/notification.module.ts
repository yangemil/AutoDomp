import { Module } from '@nestjs/common';
import { DataModule } from '../data';
import { NotificationService } from './notification.service';

@Module({
  imports: [DataModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
