import { Controller, Post, Body, Param, Patch, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CirculationService } from './circulation.service';
import { CreateLoanDto } from './dto/create-loan.dto';

@ApiTags('circulation')
@Controller('circulation')
export class CirculationController {
  constructor(private readonly circulationService: CirculationService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Borrow a book' })
  checkOut(@Body() createLoanDto: CreateLoanDto) {
    return this.circulationService.checkOut(createLoanDto);
  }

  @Patch('checkin/:id')
  @ApiOperation({ summary: 'Return a book' })
  checkIn(@Param('id') id: string) {
    return this.circulationService.checkIn(id);
  }

  @Get()
  @ApiOperation({ summary: 'List all loans' })
  findAll() {
    return this.circulationService.findAll();
  }
}
