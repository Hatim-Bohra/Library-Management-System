import { Controller, Get, Param, Delete, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { Roles, GetCurrentUserId, GetCurrentUser } from '../auth/decorators';
import { Role, User } from '@repo/database';
import { CreateMemberDto } from './dto';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) { }

  @Post()
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user (Admin/Librarian)' })
  create(@Body() dto: CreateMemberDto, @GetCurrentUser() currentUser: any) {
    return this.membersService.create(dto, currentUser);
  }

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
