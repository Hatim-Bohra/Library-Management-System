import { Module } from '@nestjs/common';
import { FinesService } from './fines.service';
import { FinesController } from './fines.controller';

@Module({
    providers: [FinesService],
    controllers: [FinesController],
    exports: [FinesService],
})
export class FinesModule { }
