import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '../auth/decorators';
import { Role } from '@prisma/client';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Roles(Role.ADMIN, Role.LIBRARIAN)
    @ApiBearerAuth()
    @Post()
    @ApiOperation({ summary: 'Create a new category (Admin/Librarian)' })
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    @Public()
    @Get()
    @ApiOperation({ summary: 'List all categories' })
    findAll() {
        return this.categoriesService.findAll();
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get a category by ID' })
    findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(id);
    }

    @Roles(Role.ADMIN, Role.LIBRARIAN)
    @ApiBearerAuth()
    @Patch(':id')
    @ApiOperation({ summary: 'Update a category (Admin/Librarian)' })
    update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a category (Admin)' })
    remove(@Param('id') id: string) {
        return this.categoriesService.remove(id);
    }
}
