import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { FinesService } from './fines.service';
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Audit } from '../common/decorators/audit.decorator';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

@ApiTags('Fines')
@UseInterceptors(AuditInterceptor)
@Controller('fines')
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @ApiOperation({ summary: 'Get all fine rules' })
  @ApiResponse({ status: 200, description: 'List of fine rules.' })
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Get('rules')
  getRules() {
    return this.finesService.getRules();
  }

  @ApiOperation({ summary: 'Update fine rule for a specific role' })
  @ApiResponse({ status: 200, description: 'Fine rule updated.' })
  @ApiParam({
    name: 'role',
    enum: Role,
    description: 'User role to update rule for',
  })
  @ApiBody({
    schema: {
      example: {
        gracePeriod: 7,
        dailyRate: 2,
        maxFine: 50,
        lostBookProcessingFee: 20,
      },
    },
  })
  @Audit('UPDATE_FINE_RULE', 'FineRule')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Put('rules/:role')
  updateRule(
    @Param('role') role: Role,
    @Body()
    data: {
      gracePeriod: number;
      dailyRate: number;
      maxFine?: number;
      lostBookProcessingFee: number;
    },
  ) {
    return this.finesService.updateRule(role, data);
  }
}
