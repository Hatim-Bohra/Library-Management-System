import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { FinesService } from './fines.service';
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('fines')
export class FinesController {
    constructor(private readonly finesService: FinesService) { }

    // Placeholder for rule management endpoints
    // POST /fines/rules (Admin) - To be implemented if needed by UI
}
