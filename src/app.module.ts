import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { WebModule } from './modules/web';
import { DataModule } from './modules/data';
import { AIModule } from './modules/ai';
import { TestEngineModule } from './modules/test-engine';
import { ReportModule } from './modules/report';
import { NotificationModule } from './modules/notification';
import { TimerModule } from './modules/timer';
import { LoggingModule } from './modules/logging';
import { AuthModule } from './modules/auth';
import { PermissionsModule } from './modules/permissions';  // 新增
import { RoleMenuPermissionsModule } from './modules/role-menu-permissions';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
      serveStaticOptions: {
        index: false,
      },
    }),
    DataModule,
    AIModule,
    TestEngineModule,
    ReportModule,
    NotificationModule,
    TimerModule,
    LoggingModule,  // 新增
    WebModule,
    RoleMenuPermissionsModule,
  ],
})
export class AppModule {}
