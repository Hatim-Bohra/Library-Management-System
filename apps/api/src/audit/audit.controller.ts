import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@repo/database';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @ApiOperation({ summary: 'Get audit logs' })
    @ApiResponse({ status: 200, description: 'List of audit logs.' })
    @Get()
    @Roles(Role.ADMIN)
    findAll() {
        return this.auditService.findAll();
    }
}
