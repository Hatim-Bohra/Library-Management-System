import { Module } from '@nestjs/common';
import { CirculationService } from './circulation.service';
import { CirculationController } from './circulation.controller';
import { DatabaseModule } from '../database/database.module';
import { FinesModule } from '../fines/fines.module';

@Module({
  imports: [DatabaseModule, FinesModule],
  controllers: [CirculationController],
  providers: [CirculationService],
})
export class CirculationModule { }
