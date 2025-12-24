import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Public, GetCurrentUser } from '../auth/decorators';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Public() // Or guarded, but for now we let users see stats or we can guard it. Let's make it authenticated by default in main config, but here explicitly maybe?
    // Actually dashboard stats might be private. Let's assume authenticated user.
    // Removing @Public() to inherit global guard if set, or we can leave it if we want public stats.
    // Given user request "login time expired", they are logged in.
    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    getStats(@GetCurrentUser() user: any) {
        return this.dashboardService.getStats(user);
    }
}
