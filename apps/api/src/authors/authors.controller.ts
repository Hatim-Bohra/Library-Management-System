import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto, UpdateAuthorDto } from './dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '../auth/decorators';
import { Role } from '@prisma/client';

@ApiTags('Authors')
@Controller('authors')
export class AuthorsController {
    constructor(private readonly authorsService: AuthorsService) { }

    @Roles(Role.ADMIN, Role.LIBRARIAN)
    @ApiBearerAuth()
    @Post()
    @ApiOperation({ summary: 'Create a new author (Admin/Librarian)' })
    create(@Body() createAuthorDto: CreateAuthorDto) {
        return this.authorsService.create(createAuthorDto);
    }

    @Public()
    @Get()
    @ApiOperation({ summary: 'List all authors' })
    findAll() {
        return this.authorsService.findAll();
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get an author by ID' })
    findOne(@Param('id') id: string) {
        return this.authorsService.findOne(id);
    }

    @Roles(Role.ADMIN, Role.LIBRARIAN)
    @ApiBearerAuth()
    @Patch(':id')
    @ApiOperation({ summary: 'Update an author (Admin/Librarian)' })
    update(@Param('id') id: string, @Body() updateAuthorDto: UpdateAuthorDto) {
        return this.authorsService.update(id, updateAuthorDto);
    }

    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @Delete(':id')
    @ApiOperation({ summary: 'Delete an author (Admin)' })
    remove(@Param('id') id: string) {
        return this.authorsService.remove(id);
    }
}
