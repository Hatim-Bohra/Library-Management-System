import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';

import { FinesModule } from '../fines/fines.module';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, FinesModule, AuditModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule { }
