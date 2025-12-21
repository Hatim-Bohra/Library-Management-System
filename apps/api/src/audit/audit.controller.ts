import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @Get()
    @ApiOperation({ summary: 'Get audit logs (Admin)' })
    findAll(@Query('skip') skip?: number, @Query('take') take?: number) {
        return this.auditService.findAll(Number(skip || 0), Number(take || 50));
    }
}
