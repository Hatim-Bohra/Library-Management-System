import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@repo/database';
import { CreateRequestDto } from './dto/create-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { JwtPayload } from '../auth/types'; // Assuming this exports imports properly, or verify path. 
// Step 84 showed apps/api/src/auth/types/jwtPayload.type.ts is where JwtPayload is.
// apps/api/src/auth/types/index.ts usually exports everything. I'll check imports.

@Controller('requests')
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) { }

    @Post()
    create(@GetCurrentUserId() userId: string, @Body() createRequestDto: CreateRequestDto) {
        return this.requestsService.create(userId, createRequestDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: JwtPayload) {
        return this.requestsService.findAll(user.role, user.sub);
    }

    @Patch(':id/approve')
    @Roles(Role.LIBRARIAN)
    approve(@Param('id') id: string) {
        return this.requestsService.approve(id);
    }

    @Patch(':id/reject')
    @Roles(Role.LIBRARIAN)
    reject(@Param('id') id: string, @Body() rejectRequestDto: RejectRequestDto) {
        return this.requestsService.reject(id, rejectRequestDto);
    }

    @Patch(':id/collect')
    @Roles(Role.LIBRARIAN)
    collect(@Param('id') id: string) {
        return this.requestsService.collect(id);
    }

    @Patch(':id/dispatch')
    @Roles(Role.LIBRARIAN)
    dispatch(@Param('id') id: string) {
        return this.requestsService.dispatch(id);
    }

    @Patch(':id/deliver')
    @Roles(Role.LIBRARIAN)
    deliver(@Param('id') id: string) {
        return this.requestsService.confirmDelivery(id);
    }

    @Patch(':id/delivery-fail')
    @Roles(Role.LIBRARIAN)
    failDelivery(@Param('id') id: string, @Body() rejectRequestDto: RejectRequestDto) {
        // Reusing RejectRequestDto for the reason field, or we could create a specialized FailDeliveryDto
        // Since RejectRequestDto just has 'reason', it fits perfectly.
        return this.requestsService.failDelivery(id, rejectRequestDto.reason);
    }
}
