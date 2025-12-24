import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Public, GetCurrentUser } from '../auth/decorators';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    // Authenticated access only
    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    getStats(@GetCurrentUser() user: any) {
        return this.dashboardService.getStats(user);
    }
}
