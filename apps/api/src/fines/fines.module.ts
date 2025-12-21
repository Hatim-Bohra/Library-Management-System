import { Module } from '@nestjs/common';
import { FinesService } from './fines.service';
import { FinesController } from './fines.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [FinesService],
  controllers: [FinesController],
  exports: [FinesService],
})
export class FinesModule { }
