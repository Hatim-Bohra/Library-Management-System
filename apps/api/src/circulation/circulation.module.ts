import { Module } from '@nestjs/common';
import { CirculationService } from './circulation.service';
import { CirculationController } from './circulation.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CirculationController],
  providers: [CirculationService],
})
export class CirculationModule {}
