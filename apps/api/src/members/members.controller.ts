import { Controller, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { Roles, GetCurrentUserId, GetCurrentUser } from '../auth/decorators';
import { Role, User } from '@repo/database';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) { }

  @Get()
  @ApiOperation({ summary: 'List all members' })
  findAll() {
    return this.membersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get member details' })
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a member' })
  remove(@Param('id') id: string, @GetCurrentUser() user: any) {
    return this.membersService.remove(id, user);
  }
}
