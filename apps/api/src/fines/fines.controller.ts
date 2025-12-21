import { Controller, Get, Body, Put, Param, UseGuards } from '@nestjs/common';
import { FinesService } from './fines.service';
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Fines')
@Controller('fines')
export class FinesController {
    constructor(private readonly finesService: FinesService) { }

    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @Get('rules')
    @ApiOperation({ summary: 'Get all fine rules (Admin)' })
    getRules() {
        return this.finesService.getRules();
    }

    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @Put('rules/:role')
    @ApiOperation({ summary: 'Update fine rule for a role (Admin)' })
    updateRule(
        @Param('role') role: Role,
        @Body() data: { gracePeriod: number; dailyRate: number; maxFine?: number; lostBookProcessingFee: number }
    ) {
        return this.finesService.updateRule(role, data);
    }
}
