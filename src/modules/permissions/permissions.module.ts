import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { DataModule } from '../data';

@Module({
  imports: [DataModule],
  providers: [PermissionsService],
  controllers: [PermissionsController],
  exports: [PermissionsService],
})
export class PermissionsModule {}
