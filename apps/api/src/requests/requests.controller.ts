import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@repo/database';
import { CreateRequestDto } from './dto/create-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { JwtPayload } from '../auth/types/jwtPayload.type';
import { Audit } from '../common/decorators/audit.decorator';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { GetRequestsQueryDto } from './dto/get-requests-query.dto';

@ApiTags('Requests')
@UseInterceptors(AuditInterceptor)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) { }

  @ApiOperation({ summary: 'Create a new book request' })
  @ApiResponse({
    status: 201,
    description: 'The request has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request (e.g. book not available, user already has request).',
  })
  @ApiBody({ type: CreateRequestDto })
  @Audit('CREATE_REQUEST', 'BookRequest')
  @Post()
  create(
    @GetCurrentUserId() userId: string,
    @Body() createRequestDto: CreateRequestDto,
  ) {
    return this.requestsService.create(userId, createRequestDto);
  }

  @ApiOperation({ summary: 'Get pending requests count (Admin/Librarian)' })
  @ApiResponse({ status: 200, description: 'Count of pending requests.' })
  @Get('pending-count')
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  getPendingCount() {
    return this.requestsService.getPendingCount();
  }

  @ApiOperation({
    summary: 'Get all requests (Admin/Librarian) or User requests',
  })
  @ApiResponse({ status: 200, description: 'List of requests.' })
  @Get()
  findAll(
    @GetCurrentUser() user: JwtPayload,
    @Query() query: GetRequestsQueryDto,
  ) {
    return this.requestsService.findAll(user.role, user.sub, query);
  }

  @ApiOperation({ summary: 'Approve a request (Librarian only)' })
  @ApiResponse({
    status: 200,
    description: 'Request approved and inventory reserved.',
  })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @Audit('APPROVE_REQUEST', 'BookRequest')
  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  approve(@Param('id') id: string) {
    return this.requestsService.approve(id);
  }

  @ApiOperation({ summary: 'Reject a request (Librarian only)' })
  @ApiResponse({ status: 200, description: 'Request rejected.' })
  @ApiBody({ type: RejectRequestDto })
  @Audit('REJECT_REQUEST', 'BookRequest')
  @Patch(':id/reject')
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  reject(@Param('id') id: string, @Body() rejectRequestDto: RejectRequestDto) {
    return this.requestsService.reject(id, rejectRequestDto);
  }

  @ApiOperation({
    summary:
      'Mark request as collected (Pickup) -> Creates Loan (Librarian only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Request fulfilled and book issued.',
  })
  @Audit('COLLECT_REQUEST', 'BookRequest')
  @Patch(':id/collect')
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  collect(@Param('id') id: string) {
    return this.requestsService.collect(id);
  }

  @ApiOperation({ summary: 'Dispatch a request (Delivery) (Librarian only)' })
  @ApiResponse({
    status: 200,
    description: 'Request marked as Out for Delivery.',
  })
  @Audit('DISPATCH_REQUEST', 'BookRequest')
  @Patch(':id/dispatch')
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  dispatch(@Param('id') id: string) {
    return this.requestsService.dispatch(id);
  }

  @ApiOperation({
    summary: 'Confirm delivery (Delivery) -> Creates Loan (Librarian only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery confirmed and book issued.',
  })
  @Audit('DELIVER_REQUEST', 'BookRequest')
  @Patch(':id/deliver')
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  deliver(@Param('id') id: string) {
    return this.requestsService.confirmDelivery(id);
  }

  @ApiOperation({ summary: 'Mark delivery as failed (Librarian only)' })
  @ApiResponse({ status: 200, description: 'Delivery marked as failed.' })
  @Audit('FAIL_DELIVERY', 'BookRequest')
  @Patch(':id/delivery-fail')
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  failDelivery(
    @Param('id') id: string,
    @Body() rejectRequestDto: RejectRequestDto,
  ) {
    // Reusing RejectRequestDto for the reason field, or we could create a specialized FailDeliveryDto
    // Since RejectRequestDto just has 'reason', it fits perfectly.
    return this.requestsService.failDelivery(id, rejectRequestDto.reason);
  }
}
