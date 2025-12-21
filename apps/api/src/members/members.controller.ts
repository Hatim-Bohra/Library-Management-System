import { Controller, Get, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MembersService } from './members.service';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

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
  @ApiOperation({ summary: 'Remove a member' })
  remove(@Param('id') id: string) {
    return this.membersService.remove(id);
  }
}
