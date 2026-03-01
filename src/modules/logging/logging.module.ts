import { Module, Global } from '@nestjs/common';
import { LoggingService } from './logging.service';

/**
 * 日志模块
 * 使用 @Global() 装饰器，使其在整个应用中可用
 * 其他模块无需导入即可使用 LoggingService
 */
@Global()
@Module({
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
