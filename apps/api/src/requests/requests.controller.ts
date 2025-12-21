import { Body, Controller, Get, Param, Patch, Post, UseInterceptors } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@repo/database';
import { CreateRequestDto } from './dto/create-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { JwtPayload } from '../auth/types';
import { Audit } from '../common/decorators/audit.decorator';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

@UseInterceptors(AuditInterceptor)
@Controller('requests')
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) { }

    @Audit('CREATE_REQUEST', 'BookRequest')
    @Post()
    create(@GetCurrentUserId() userId: string, @Body() createRequestDto: CreateRequestDto) {
        return this.requestsService.create(userId, createRequestDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: JwtPayload) {
        return this.requestsService.findAll(user.role, user.sub);
    }

    @Audit('APPROVE_REQUEST', 'BookRequest')
    @Patch(':id/approve')
    @Roles(Role.LIBRARIAN)
    approve(@Param('id') id: string) {
        return this.requestsService.approve(id);
    }

    @Audit('REJECT_REQUEST', 'BookRequest')
    @Patch(':id/reject')
    @Roles(Role.LIBRARIAN)
    reject(@Param('id') id: string, @Body() rejectRequestDto: RejectRequestDto) {
        return this.requestsService.reject(id, rejectRequestDto);
    }

    @Audit('COLLECT_REQUEST', 'BookRequest')
    @Patch(':id/collect')
    @Roles(Role.LIBRARIAN)
    collect(@Param('id') id: string) {
        return this.requestsService.collect(id);
    }

    @Audit('DISPATCH_REQUEST', 'BookRequest')
    @Patch(':id/dispatch')
    @Roles(Role.LIBRARIAN)
    dispatch(@Param('id') id: string) {
        return this.requestsService.dispatch(id);
    }

    @Audit('DELIVER_REQUEST', 'BookRequest')
    @Patch(':id/deliver')
    @Roles(Role.LIBRARIAN)
    deliver(@Param('id') id: string) {
        return this.requestsService.confirmDelivery(id);
    }

    @Audit('FAIL_DELIVERY', 'BookRequest')
    @Patch(':id/delivery-fail')
    @Roles(Role.LIBRARIAN)
    failDelivery(@Param('id') id: string, @Body() rejectRequestDto: RejectRequestDto) {
        // Reusing RejectRequestDto for the reason field, or we could create a specialized FailDeliveryDto
        // Since RejectRequestDto just has 'reason', it fits perfectly.
        return this.requestsService.failDelivery(id, rejectRequestDto.reason);
    }
}
