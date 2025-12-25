import { Controller, Get, Param, Patch, UseInterceptors } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseInterceptors(AuditInterceptor)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @ApiOperation({ summary: 'Get recent notifications' })
    @Get()
    findAll(@GetCurrentUser() user: any) {
        return this.notificationsService.findAll(user.sub);
    }

    @ApiOperation({ summary: 'Get unread count' })
    @Get('unread-count')
    getUnreadCount(@GetCurrentUser() user: any) {
        return this.notificationsService.getUnreadCount(user.sub);
    }

    @ApiOperation({ summary: 'Mark notification as read' })
    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @GetCurrentUser() user: any) {
        return this.notificationsService.markAsRead(id, user.sub);
    }
}
