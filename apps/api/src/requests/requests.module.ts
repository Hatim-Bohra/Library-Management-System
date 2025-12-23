import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';

import { FinesModule } from '../fines/fines.module';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';

import { BooksModule } from '../books/books.module';

@Module({
  imports: [DatabaseModule, FinesModule, AuditModule, BooksModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule { }
