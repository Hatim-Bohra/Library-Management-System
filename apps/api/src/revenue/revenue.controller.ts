import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { Roles } from '../auth/decorators';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Revenue')
@ApiBearerAuth()
@Controller('revenue')
@Roles(Role.ADMIN)
export class RevenueController {
    constructor(private readonly revenueService: RevenueService) { }

    @Get('analytics')
    @ApiOperation({ summary: 'Get revenue analytics' })
    getAnalytics(@Query('period') period: 'daily' | 'monthly' | 'yearly') {
        return this.revenueService.getRevenueStats(period);
    }
}
