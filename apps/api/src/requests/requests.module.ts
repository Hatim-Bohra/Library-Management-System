import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';

import { FinesModule } from '../fines/fines.module';

@Module({
    imports: [FinesModule],
    controllers: [RequestsController],
    providers: [RequestsService],
})
export class RequestsModule { }
