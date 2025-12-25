import { Controller, Get, Query, ForbiddenException } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { Roles, GetCurrentUser } from '../auth/decorators';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from '../auth/types/jwtPayload.type';

@ApiTags('Revenue')
@ApiBearerAuth()
@Controller('revenue')
@Roles(Role.ADMIN, Role.LIBRARIAN)
export class RevenueController {
    constructor(private readonly revenueService: RevenueService) { }

    @Get('analytics')
    @ApiOperation({ summary: 'Get revenue analytics' })
    getAnalytics(
        @Query('period') period: 'daily' | 'monthly' | 'yearly',
        @GetCurrentUser() user: JwtPayload,
    ) {
        if (user.role === Role.LIBRARIAN && period !== 'daily') {
            throw new ForbiddenException('Librarians can only view daily revenue');
        }
        return this.revenueService.getRevenueStats(period);
    }
}
